import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';
import { ADSENSE_CLIENT_ID } from '../config/ads';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const originalRenderPage = ctx.renderPage;

    // Run the React rendering logic synchronously
    ctx.renderPage = () =>
      originalRenderPage({
        // Useful for wrapping the whole react tree
        enhanceApp: (App) => App,
        // Useful for wrapping in a per-page basis
        enhanceComponent: (Component) => Component,
      });

    // Run the parent `getInitialProps`, it now includes the custom `renderPage`
    const initialProps = await Document.getInitialProps(ctx);

    return initialProps;
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Google AdSense: site verification + the single adsbygoogle.js load for the page */}
          <meta name="google-adsense-account" content={ADSENSE_CLIENT_ID} />
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
          ></script>
          {/* TinyAdz */}
          <script src="https://cdn.apitiny.net/scripts/v2.0/main.js" data-site-id="6a00b100afd556cb45e3ae03" data-test-mode="false" async></script>
          {/*
            Google Fonts removed — Inter is now self-hosted via next/font/google in _app.tsx.
            This eliminates the render-blocking external font request that was hurting LCP.
          */}
        </Head>
        <body className="bg-gray-50">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
