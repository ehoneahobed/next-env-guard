import { Html, Head, Main, NextScript } from 'next/document';
import { PublicEnvScript } from 'next-env-guard/script';

export default function Document() {
  return (
    <Html>
      <Head>
        <PublicEnvScript />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
