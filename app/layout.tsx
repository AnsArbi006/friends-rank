import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Friends Rank | Party Game',
  description: 'Das Browser-Partyspiel fuer deine Freundesgruppe.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
