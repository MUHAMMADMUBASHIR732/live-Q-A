import { Familjen_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Two fonts only, to keep the page light: one grotesque for everything, one mono for codes.
const sans = Familjen_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata = {
  title: "Hexa AskBoard: live Q&A for talks, classes and meetings",
  description:
    "People scan a code, ask questions and vote. You see the best ones first and can reply to anyone privately, even with a file.",
};

export const viewport = {
  themeColor: "#E8E2D3",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
