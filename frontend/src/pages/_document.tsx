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
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
          {/* Emergency inline CSS to hide TechCorp jobs */}
          <style dangerouslySetInnerHTML={{ __html: `
            /* Hide any TechCorp jobs through various selectors */
            div:has(h3:contains("TechCorp")) { display: none !important; }
            div:has(p:contains("TechCorp")) { display: none !important; }
            div:has(a[href*="TechCorp"]) { display: none !important; }
            div:has(span:contains("TechCorp")) { display: none !important; }
            
            /* Hide "Remote Data Entry Specialist" job specifically */
            div:has(h3:contains("Remote Data Entry Specialist"):has(+ p:contains("TechCorp"))) { 
              display: none !important; 
            }
            
            /* Hide any jobs with job1 type IDs */
            [data-job-id^="job"] { display: none !important; }
            [data-job-id*="mock"] { display: none !important; }
            [data-mock="true"] { display: none !important; }
            
            /* Hide any TechCorp company jobs */
            [data-company="TechCorp Solutions"] { display: none !important; }
            [data-company*="TechCorp"] { display: none !important; }
          `}} />
        </Head>
        <body className="bg-gray-50">
          <Main />
          <NextScript />
          
          {/* Emergency script to hide TechCorp mock jobs */}
          <script dangerouslySetInnerHTML={{ __html: `
            // Run as soon as DOM is ready
            document.addEventListener('DOMContentLoaded', function() {
              // Helper function to hide elements
              function hideElements(selector) {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                  el.style.display = 'none';
                  el.setAttribute('data-filtered', 'true');
                });
              }
              
              // Hide any elements containing TechCorp
              ['h3', 'p', 'span', 'div', 'a'].forEach(tag => {
                document.querySelectorAll(tag).forEach(el => {
                  if (el.textContent && el.textContent.includes('TechCorp')) {
                    // Find the job card container
                    let parent = el;
                    // Go up to 5 levels to find a job card container
                    for (let i = 0; i < 5; i++) {
                      parent = parent.parentElement;
                      if (!parent) break;
                      if (parent.classList.contains('job-card') || 
                          parent.classList.contains('enhanced-job-card') ||
                          parent.classList.contains('grid-cols-3') ||
                          parent.classList.contains('relative')) {
                        parent.style.display = 'none';
                        parent.setAttribute('data-filtered', 'true');
                        break;
                      }
                    }
                  }
                });
              });
              
              // Specifically target Remote Data Entry Specialist jobs from TechCorp
              document.querySelectorAll('h3').forEach(h3 => {
                if (h3.textContent && h3.textContent.includes('Remote Data Entry Specialist')) {
                  const parentCard = h3.closest('.job-card') || h3.closest('div[class*="card"]') || h3.parentElement?.parentElement?.parentElement;
                  if (parentCard) {
                    const companyElements = parentCard.querySelectorAll('p');
                    companyElements.forEach(el => {
                      if (el.textContent && el.textContent.includes('TechCorp')) {
                        parentCard.style.display = 'none';
                        parentCard.setAttribute('data-filtered', 'true');
                      }
                    });
                  }
                }
              });
            });
          `}} />
        </body>
      </Html>
    );
  }
}

export default MyDocument; 