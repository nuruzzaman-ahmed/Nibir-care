import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | DOC&TEST",
    default: "DOC&TEST — ডাক্তার ও ডায়াগনস্টিক সেবা",
  },
  description:
    "বাংলাদেশের সবচেয়ে নির্ভরযোগ্য অনলাইন ডাক্তার সিরিয়াল ও ডায়াগনস্টিক সেবা বুকিং প্ল্যাটফর্ম। ঘরে বসেই ডাক্তার খুঁজুন, সিরিয়াল নিন।",
  keywords: [
    "ডাক্তার",
    "সিরিয়াল",
    "ডায়াগনস্টিক",
    "doctor appointment",
    "Bangladesh healthcare",
    "DOC TEST",
  ],
  openGraph: {
    type: "website",
    siteName: "DOC&TEST",
    locale: "bn_BD",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
