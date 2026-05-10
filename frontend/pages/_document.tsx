import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

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
          {/* Google AdSense */}
          <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3377844943647950" crossOrigin="anonymous"></script>
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
