import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'KLAK Studio — AI Image Generator',
  description: 'Transform ideas into cinematic visuals',
  icons: {
    icon: '/klak-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={inter.variable} suppressHydrationWarning>
      <body className={`grain ${inter.className}`}>
        {children}
      </body>
    </html>
  );
}
