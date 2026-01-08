import { PublicEnvScript } from 'next-env-guard/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Inject app namespace */}
        <PublicEnvScript namespace="app" />
        {/* Inject admin namespace */}
        <PublicEnvScript namespace="admin" />
      </head>
      <body>{children}</body>
    </html>
  );
}
