import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { PublicEnvScript } from 'next-env-guard/script';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Next.js Env Guard Example',
  description: 'Example app using next-env-guard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <PublicEnvScript />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
