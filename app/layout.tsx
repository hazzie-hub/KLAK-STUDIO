import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KLAK Studio — AI Image Generator',
  description: 'Transform ideas into cinematic visuals',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="grain">
        {children}
      </body>
    </html>
  );
}
