import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata = {
  title: "Askboard: live Q&A for any event",
  description:
    "Your audience scans a QR code, asks questions, and upvotes the best ones. AI hides spam and groups similar questions.",
};

export const viewport = {
  themeColor: "#EFF3F1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
