// Pulls a session join code out of whatever a QR code contains: a full join link
// (from any address) or just the six characters.
export function codeFromScan(text) {
  if (!text) return null;
  const value = String(text).trim();

  try {
    const url = new URL(value);
    const match = url.pathname.match(/\/join\/([A-Za-z0-9]{6})\/?$/);
    if (match) return match[1].toUpperCase();
  } catch {
    // not a URL, fall through
  }

  if (/^[A-Za-z0-9]{6}$/.test(value)) return value.toUpperCase();
  return null;
}
