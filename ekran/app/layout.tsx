import type { Metadata, Viewport } from "next";
import { Inter, Roboto } from "next/font/google";
import "./globals.css";

/**
 * CLAUDE.md §4: Inter (iOS görünümü), Roboto (Android görünümü). SF Pro kullanılmaz.
 * next/font fontları derleme anında indirip projeye gömer — sette internet gerekmez.
 * Türkçe karakterler için "latin-ext" alt kümesi şart (İ/ı/ş/ğ).
 */
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "block",
});

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-roboto",
  display: "block",
});

export const metadata: Metadata = {
  title: "Ekran",
  description: "Set ekran sistemi",
  // Açıkça bildirilmezse tarayıcı /favicon.ico ister ve konsola 404 düşer.
  // CLAUDE.md §2.6 gereği konsolun temiz kalması hata ayıklamayı kolaylaştırır.
  icons: { icon: "/icon.svg" },
  // CLAUDE.md §4: iOS'ta ana ekrana eklenince tam ekran açılsın.
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Ekran" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${inter.variable} ${roboto.variable}`}>
      <body>{children}</body>
    </html>
  );
}
