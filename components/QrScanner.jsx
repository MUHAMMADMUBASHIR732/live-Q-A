"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { codeFromScan } from "@/lib/joinCode";
import Button from "@/components/Button";

const MAX_WIDTH = 720;

// Opens the camera and reads a Hexa AskBoard QR code. Uses the phone's built-in QR detector
// where there is one, otherwise a small JavaScript decoder, so it works on any phone or tablet.
// If the camera cannot be used, the person can take a photo of the code instead.
export default function QrScanner({ onCode, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const engineRef = useRef(null);
  const doneRef = useRef(false);
  const hintAtRef = useRef(0);
  const fileRef = useRef(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  const [status, setStatus] = useState("starting"); // starting | scanning | denied | insecure | unsupported | error
  const [facing, setFacing] = useState("environment");
  const [canFlip, setCanFlip] = useState(false);
  const [canTorch, setCanTorch] = useState(false);
  const [torch, setTorch] = useState(false);
  const [hint, setHint] = useState("");

  const stop = useCallback(() => {
    clearTimeout(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // A code was read. Accept it only if it is one of ours.
  const found = useCallback(
    (value) => {
      const code = codeFromScan(value);
      if (!code) {
        if (Date.now() - hintAtRef.current > 2500) {
          hintAtRef.current = Date.now();
          setHint("That is not a Hexa AskBoard code. Keep looking.");
        }
        return false;
      }
      if (doneRef.current) return true;
      doneRef.current = true;
      stop();
      if (navigator.vibrate) navigator.vibrate(60);
      onCodeRef.current(code);
      return true;
    },
    [stop]
  );

  // Draws an image or video frame small, then runs the JavaScript decoder on it.
  const decodeWithJs = useCallback(async (source, width, height, attempts = "dontInvert") => {
    const { default: jsQR } = await import("jsqr");
    const scale = Math.min(1, MAX_WIDTH / width);
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    const canvas = canvasRef.current;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(source, 0, 0, w, h);
    const result = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: attempts });
    return result ? result.data : null;
  }, []);

  const loadEngine = useCallback(async () => {
    if ("BarcodeDetector" in window) {
      try {
        const formats = await window.BarcodeDetector.getSupportedFormats();
        if (formats.includes("qr_code")) {
          const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          return {
            delay: 110,
            read: async (video) => {
              const codes = await detector.detect(video);
              return codes[0] ? codes[0].rawValue : null;
            },
          };
        }
      } catch {
        /* fall back to the JavaScript decoder */
      }
    }
    await import("jsqr"); // download it now so the first frame is not slow
    return {
      delay: 150,
      read: (video) => decodeWithJs(video, video.videoWidth, video.videoHeight),
    };
  }, [decodeWithJs]);

  const loop = useCallback(() => {
    const tick = async () => {
      const video = videoRef.current;
      const engine = engineRef.current;
      if (!video || !engine || doneRef.current || !streamRef.current) return;
      if (video.readyState >= 2 && video.videoWidth > 0) {
        try {
          const value = await engine.read(video);
          if (value && found(value)) return;
        } catch {
          /* a bad frame, try the next one */
        }
      }
      timerRef.current = setTimeout(tick, engine.delay);
    };
    tick();
  }, [found]);

  const start = useCallback(
    async (facingMode) => {
      stop();
      doneRef.current = false;
      setStatus("starting");
      setHint("");

      // Browsers only allow the camera on https (or localhost).
      if (!window.isSecureContext) return setStatus("insecure");
      if (!navigator.mediaDevices?.getUserMedia) return setStatus("unsupported");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return stop();
        video.srcObject = stream;
        await video.play();

        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities ? track.getCapabilities() : {};
        setCanTorch(Boolean(caps.torch));
        setTorch(false);
        navigator.mediaDevices
          .enumerateDevices()
          .then((d) => setCanFlip(d.filter((x) => x.kind === "videoinput").length > 1))
          .catch(() => {});

        if (!engineRef.current) engineRef.current = await loadEngine();
        setStatus("scanning");
        loop();
      } catch (err) {
        const blocked = err && (err.name === "NotAllowedError" || err.name === "SecurityError");
        setStatus(blocked ? "denied" : "error");
      }
    },
    [stop, loadEngine, loop]
  );

  useEffect(() => {
    start(facing);
    return stop;
  }, [facing, start, stop]);

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch }] });
      setTorch(!torch);
    } catch {
      setHint("This camera cannot turn on its light.");
    }
  }

  // Fallback: take or choose a photo of the code, then read it.
  async function onPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setHint("Reading the photo...");
    try {
      const bitmap = await createImageBitmap(file);
      const value = await decodeWithJs(bitmap, bitmap.width, bitmap.height, "attemptBoth");
      bitmap.close?.();
      if (!value || !found(value)) {
        setHint(value ? "That is not a Hexa AskBoard code." : "No code found. Fill the frame with the code and try again.");
      }
    } catch {
      setHint("That photo could not be read. Try again.");
    }
  }

  const cameraProblem = ["denied", "insecure", "unsupported", "error"].includes(status);
  const problemText = {
    denied:
      "The camera is blocked for this site. Allow the camera in your browser settings, then try again.",
    insecure:
      "Browsers only allow the camera on a secure (https) address. You can still take a photo of the code below.",
    unsupported: "This browser cannot open the camera. You can take a photo of the code below.",
    error: "The camera could not start. Close other apps that use it, or take a photo of the code below.",
  }[status];

  return (
    <div className="flex h-full flex-col bg-ink text-paper">
      <div className="flex items-center justify-between border-b border-paper/25 px-4 py-3">
        <p className="text-lg font-bold tracking-tight">Scan the code on the screen</p>
        <Button type="button" variant="ghostDark" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className={`absolute inset-0 h-full w-full object-cover ${cameraProblem ? "hidden" : ""}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {!cameraProblem && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-[min(68vw,18rem)] w-[min(68vw,18rem)]">
              {[
                "left-0 top-0 border-l-4 border-t-4",
                "right-0 top-0 border-r-4 border-t-4",
                "bottom-0 left-0 border-b-4 border-l-4",
                "bottom-0 right-0 border-b-4 border-r-4",
              ].map((c) => (
                <span key={c} className={`absolute h-10 w-10 border-sand ${c}`} />
              ))}
            </div>
          </div>
        )}

        {status === "starting" && (
          <p className="absolute inset-x-0 top-6 text-center font-mono text-sm text-paper/80">
            Starting the camera...
          </p>
        )}

        {cameraProblem && (
          <div className="mx-auto flex h-full max-w-md flex-col justify-center gap-5 px-6">
            <p className="text-2xl font-bold leading-tight tracking-tight">The camera is not available</p>
            <p className="text-paper/85">{problemText}</p>
            {status === "denied" || status === "error" ? (
              <div>
                <Button type="button" variant="sand" onClick={() => start(facing)}>
                  Try the camera again
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="border-t border-paper/25 px-4 py-4">
        <p role="status" className="min-h-6 text-center text-sm text-paper/85">
          {hint || (status === "scanning" ? "Point the camera at the QR code." : "")}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {canFlip && !cameraProblem && (
            <Button
              type="button"
              variant="ghostDark"
              size="sm"
              onClick={() => setFacing(facing === "environment" ? "user" : "environment")}
            >
              Flip camera
            </Button>
          )}
          {canTorch && !cameraProblem && (
            <Button type="button" variant="ghostDark" size="sm" onClick={toggleTorch}>
              {torch ? "Light off" : "Light on"}
            </Button>
          )}
          <Button type="button" variant={cameraProblem ? "sand" : "ghostDark"} size="sm" onClick={() => fileRef.current?.click()}>
            Take a photo of the code
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={onPhoto}
          />
        </div>
      </div>
    </div>
  );
}
