/**
 * Regional Features Test Script
 * 
 * This script helps test the global audience features of our SEO landing pages
 * by simulating different regional settings.
 */

// Function to initialize the regional features tester
const initRegionalTester = () => {
  // Only run in development mode
  if (process.env.NODE_ENV !== 'development') return;
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRegionalTester);
  } else {
    initRegionalTester();
  }
  
  function initRegionalTester() {
    console.log('🌎 Regional Features Test Script initialized');
    
    // Create test toolbar
    const toolbar = document.createElement('div');
    toolbar.id = 'regional-test-toolbar';
    toolbar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #2563eb;
      color: white;
      padding: 10px;
      font-family: sans-serif;
      font-size: 14px;
      z-index: 9999;
      display: flex;
      justify-content: space-between;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    // Create toolbar content
    toolbar.innerHTML = `
      <div>
        <strong>Global Audience Features Tester</strong> | 
        <span id="current-region">Current Region: Detecting...</span> | 
        <span id="current-timezone">Timezone: Detecting...</span>
      </div>
      <div>
        <button id="simulate-us" class="region-btn">US</button>
        <button id="simulate-uk" class="region-btn">UK</button>
        <button id="simulate-eu" class="region-btn">EU</button>
        <button id="simulate-au" class="region-btn">AU</button>
        <button id="simulate-ca" class="region-btn">CA</button>
        <button id="highlight-features" class="feature-btn">Highlight Features</button>
        <button id="hide-toolbar" class="control-btn">Hide</button>
      </div>
    `;
    
    // Add styles for buttons
    const style = document.createElement('style');
    style.textContent = `
      #regional-test-toolbar button {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 5px 10px;
        margin-left: 5px;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
      }
      #regional-test-toolbar button:hover {
        background: rgba(255,255,255,0.3);
      }
      #regional-test-toolbar button.active {
        background: rgba(255,255,255,0.4);
        font-weight: bold;
      }
      .global-feature-highlight {
        outline: 3px solid #f97316 !important;
        position: relative;
      }
      .global-feature-highlight::after {
        content: attr(data-feature-name);
        position: absolute;
        top: -20px;
        left: 0;
        background: #f97316;
        color: white;
        padding: 2px 6px;
        font-size: 12px;
        border-radius: 4px;
        z-index: 9999;
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toolbar);
    document.body.style.marginTop = '40px';
    
    // Update current region and timezone
    function updateCurrentRegion() {
      const regionEl = document.getElementById('current-region');
      const timezoneEl = document.getElementById('current-timezone');
      
      // Detect region from language
      const language = navigator.language;
      let region = 'Unknown';
      
      if (language.includes('en-US')) region = 'US';
      else if (language.includes('en-GB')) region = 'UK';
      else if (language.includes('en-CA')) region = 'CA';
      else if (language.includes('en-AU')) region = 'AU';
      else if (['de', 'fr', 'es', 'it', 'nl'].some(lang => language.startsWith(lang))) region = 'EU';
      
      regionEl.textContent = `Current Region: ${region}`;
      timezoneEl.textContent = `Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
      
      // Highlight active button
      document.querySelectorAll('.region-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      
      const activeBtn = document.getElementById(`simulate-${region.toLowerCase()}`);
      if (activeBtn) activeBtn.classList.add('active');
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
                 region === 'CA' ? 'en-CA' :
                 region === 'AU' ? 'en-AU' :
                 region === 'EU' ? 'fr-FR' : 
                 window._originalLanguage;
        }
      });
      
      // Update UI
      updateCurrentRegion();
      
      // Refresh components that depend on region
      refreshRegionalComponents();
    }
    
    // Refresh components that depend on region
    function refreshRegionalComponents() {
      // Dispatch a custom event that regional components can listen for
      const event = new CustomEvent('regionchange', {
        detail: { region: navigator.language }
      });
      document.dispatchEvent(event);
      
      // Force re-render of React components by simulating a window resize
      window.dispatchEvent(new Event('resize'));
    }
    
    // Highlight global audience features
    function highlightGlobalFeatures() {
      // Toggle highlight state
      const isHighlighting = document.body.classList.toggle('highlighting-features');
      
      if (isHighlighting) {
        document.getElementById('highlight-features').textContent = 'Remove Highlights';
        
        // Add highlights to all global audience feature components
        const featureSelectors = [
          { selector: '[data-testid="timezone-compatibility"], .timezone-compatibility', name: 'Timezone Compatibility' },
          { selector: '[data-testid="regional-job-market"], .regional-job-market', name: 'Regional Job Market' },
          { selector: '[data-testid="application-guide"], .application-guide', name: 'Application Guide' },
          { selector: '[data-testid="legal-disclaimer"], .legal-disclaimer', name: 'Legal Disclaimer' },
          { selector: '[data-testid="email-signup"], .email-signup', name: 'Email Signup' }
        ];
        
        featureSelectors.forEach(({ selector, name }) => {
          document.querySelectorAll(selector).forEach(el => {
            el.classList.add('global-feature-highlight');
            el.setAttribute('data-feature-name', name);
          });
        });
      } else {
        document.getElementById('highlight-features').textContent = 'Highlight Features';
        
        // Remove highlights
        document.querySelectorAll('.global-feature-highlight').forEach(el => {
          el.classList.remove('global-feature-highlight');
          el.removeAttribute('data-feature-name');
        });
      }
    }
    
    // Event listeners
    document.getElementById('simulate-us').addEventListener('click', () => simulateRegion('US'));
    document.getElementById('simulate-uk').addEventListener('click', () => simulateRegion('UK'));
    document.getElementById('simulate-eu').addEventListener('click', () => simulateRegion('EU'));
    document.getElementById('simulate-au').addEventListener('click', () => simulateRegion('AU'));
    document.getElementById('simulate-ca').addEventListener('click', () => simulateRegion('CA'));
    document.getElementById('highlight-features').addEventListener('click', highlightGlobalFeatures);
    document.getElementById('hide-toolbar').addEventListener('click', () => {
      toolbar.style.display = 'none';
      document.body.style.marginTop = '0';
      
      // Add a small button to show the toolbar again
      const showButton = document.createElement('button');
      showButton.textContent = 'Show Region Tester';
      showButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 9999;
        padding: 5px 10px;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      `;
      showButton.addEventListener('click', () => {
        toolbar.style.display = 'flex';
        document.body.style.marginTop = '40px';
        showButton.remove();
      });
      document.body.appendChild(showButton);
    });
    
    // Initialize
    updateCurrentRegion();
    
    // Add keyboard shortcut to toggle toolbar (Alt+R)
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'r') {
        toolbar.style.display = toolbar.style.display === 'none' ? 'flex' : 'none';
        document.body.style.marginTop = toolbar.style.display === 'none' ? '0' : '40px';
      }
    });
  }
};

// Export a function to initialize the tester
export const initRegionalFeaturesTester = () => {
  // Only run in browser environment
  if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initRegionalTester);
    } else {
      initRegionalTester();
    }
  }
};

export default initRegionalFeaturesTester;
