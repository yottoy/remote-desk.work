import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

// Application wrapper
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Find verified remote data entry & administrative jobs. Work from home opportunities updated daily." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp; 