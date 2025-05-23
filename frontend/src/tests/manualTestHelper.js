/**
 * Manual Test Helper for SEO Landing Pages
 * 
 * This script helps with manual testing by adding a testing toolbar
 * to the landing pages with useful tools and information.
 */

// Function to initialize the test helper
const initTestHelper = () => {
  // Only run in development mode
  if (process.env.NODE_ENV !== 'development') return;
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTestHelper);
  } else {
    initTestHelper();
  }
  
  function initTestHelper() {
    console.log('🧪 SEO Landing Pages Test Helper initialized');
    
    // Create test toolbar
    const toolbar = document.createElement('div');
    toolbar.id = 'seo-test-toolbar';
    toolbar.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #333;
      color: white;
      padding: 10px;
      font-family: sans-serif;
      font-size: 14px;
      z-index: 9999;
      display: flex;
      justify-content: space-between;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.2);
    `;
    
    // Create toolbar content
    toolbar.innerHTML = `
      <div>
        <strong>SEO Test Mode</strong> | 
        <span id="viewport-size"></span> | 
        <span id="user-region"></span> | 
        <span id="user-timezone"></span>
      </div>
      <div>
        <button id="toggle-grid">Toggle Grid</button>
        <button id="simulate-uk">Simulate UK</button>
        <button id="simulate-us">Simulate US</button>
        <button id="simulate-eu">Simulate EU</button>
        <button id="check-schema">Check Schema</button>
        <button id="hide-toolbar">Hide</button>
      </div>
    `;
    
    document.body.appendChild(toolbar);
    
    // Update viewport size
    function updateViewportSize() {
      const viewportSizeEl = document.getElementById('viewport-size');
      viewportSizeEl.textContent = `Viewport: ${window.innerWidth}×${window.innerHeight}`;
    }
    
    // Detect user region and timezone
    function updateUserInfo() {
      const userRegionEl = document.getElementById('user-region');
      const userTimezoneEl = document.getElementById('user-timezone');
      
      const language = navigator.language;
      let region = 'Unknown';
      
      if (language.includes('en-US')) region = 'US';
      else if (language.includes('en-GB')) region = 'UK';
      else if (language.includes('en-CA')) region = 'CA';
      else if (language.includes('en-AU')) region = 'AU';
      else if (['de', 'fr', 'es', 'it', 'nl'].some(lang => language.startsWith(lang))) region = 'EU';
      
      userRegionEl.textContent = `Region: ${region}`;
      userTimezoneEl.textContent = `Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
    }
    
    // Toggle grid overlay
    function toggleGrid() {
      let gridOverlay = document.getElementById('grid-overlay');
      
      if (gridOverlay) {
        gridOverlay.remove();
      } else {
        gridOverlay = document.createElement('div');
        gridOverlay.id = 'grid-overlay';
        gridOverlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            linear-gradient(to right, rgba(255,0,0,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,0,0,0.1) 1px, transparent 1px);
          background-size: 20px 20px;
          pointer-events: none;
          z-index: 9998;
        `;
        document.body.appendChild(gridOverlay);
      }
    }
    
    // Simulate different regions
    function simulateRegion(region) {
      // Store the original language
      if (!window._originalLanguage) {
        window._originalLanguage = navigator.language;
      }
      
      // Override navigator.language
      Object.defineProperty(navigator, 'language', {
        get: function() {
          return region === 'UK' ? 'en-GB' : 
                 region === 'US' ? 'en-US' : 
                 region === 'EU' ? 'fr-FR' : 
                 window._originalLanguage;
        }
      });
      
      // Refresh the page to apply changes
      window.location.reload();
    }
    
    // Check schema markup
    function checkSchema() {
      const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]');
      
      if (schemaScripts.length === 0) {
        alert('No schema markup found on this page!');
        return;
      }
      
      let schemaData = [];
      
      schemaScripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent);
          schemaData.push(data);
        } catch (e) {
          console.error('Invalid JSON in schema markup:', e);
        }
      });
      
      // Open a new window with schema data
      const schemaWindow = window.open('', 'Schema Markup', 'width=800,height=600');
      schemaWindow.document.write(`
        <html>
          <head>
            <title>Schema Markup Checker</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              pre { background: #f5f5f5; padding: 15px; overflow: auto; }
            </style>
          </head>
          <body>
            <h1>Schema Markup on ${window.location.pathname}</h1>
            <p>Found ${schemaScripts.length} schema markup scripts</p>
            ${schemaData.map((data, i) => `
              <h2>Schema #${i+1}</h2>
              <pre>${JSON.stringify(data, null, 2)}</pre>
            `).join('')}
            <p>
              <a href="https://search.google.com/test/rich-results?url=${encodeURIComponent(window.location.href)}" target="_blank">
                Test with Google Rich Results Test
              </a>
            </p>
          </body>
        </html>
      `);
    }
    
    // Event listeners
    window.addEventListener('resize', updateViewportSize);
    document.getElementById('toggle-grid').addEventListener('click', toggleGrid);
    document.getElementById('simulate-uk').addEventListener('click', () => simulateRegion('UK'));
    document.getElementById('simulate-us').addEventListener('click', () => simulateRegion('US'));
    document.getElementById('simulate-eu').addEventListener('click', () => simulateRegion('EU'));
    document.getElementById('check-schema').addEventListener('click', checkSchema);
    document.getElementById('hide-toolbar').addEventListener('click', () => {
      toolbar.style.display = 'none';
      
      // Add a small button to show the toolbar again
      const showButton = document.createElement('button');
      showButton.textContent = 'Show Test Toolbar';
      showButton.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        z-index: 9999;
        padding: 5px;
        background: #333;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
      `;
      showButton.addEventListener('click', () => {
        toolbar.style.display = 'flex';
        showButton.remove();
      });
      document.body.appendChild(showButton);
    });
    
    // Initialize
    updateViewportSize();
    updateUserInfo();
    
    // Add keyboard shortcut to toggle toolbar (Alt+T)
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 't') {
        toolbar.style.display = toolbar.style.display === 'none' ? 'flex' : 'none';
      }
    });
  }
};

// Export a function to initialize the test helper
export const initManualTestHelper = () => {
  // Only run in browser environment
  if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initTestHelper);
    } else {
      initTestHelper();
    }
  }
};

export default initManualTestHelper;
