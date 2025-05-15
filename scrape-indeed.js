// Enhanced Indeed scraper using the JobSpyIndeedScraper module
console.log('=== STARTING ENHANCED INDEED SCRAPER ===');
console.log(`Current time: ${new Date().toUTCString()}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`Node version: ${process.version}`);

// First try to ensure all dependencies are available
try {
  console.log('Loading dependencies...');
  const path = require('path');
  const fs = require('fs');
  const axios = require('axios');
  const { execSync, spawn } = require('child_process');
  console.log('Core dependencies loaded successfully');
  
  // Load admin and data entry keywords
  const keywordsPath = path.join(__dirname, 'admin-data-entry-keywords.json');
  let keywords = {};
  
  try {
    console.log(`Loading keywords from ${keywordsPath}`);
    const keywordsData = fs.readFileSync(keywordsPath, 'utf8');
    keywords = JSON.parse(keywordsData);
    console.log(`Loaded ${keywords.job_types?.length || 0} job types, ${keywords.keywords?.length || 0} keywords, and ${keywords.search_combinations?.length || 0} search combinations`);
  } catch (error) {
    console.error(`Error loading keywords: ${error.message}`);
    console.error('Will use default search queries instead');
    keywords = {
      job_types: ['data entry', 'administrative assistant', 'virtual assistant'],
      keywords: ['remote', 'work from home'],
      exclude_keywords: ['senior', 'manager', 'director'],
      required_keywords: ['data entry', 'administrative', 'assistant'],
      description_required_terms: ['remote', 'work from home', 'virtual'],
      search_combinations: [
        { term: 'remote data entry', site: 'indeed', location: 'Remote' },
        { term: 'administrative assistant remote', site: 'indeed', location: 'Remote' }
      ]
    };
  }
  
  // Create src/utils directory if it doesn't exist
  const utilsDir = path.join(__dirname, 'src', 'utils');
  if (!fs.existsSync(utilsDir)) {
    console.log(`Creating directory: ${utilsDir}`);
    fs.mkdirSync(utilsDir, { recursive: true });
  }
  
  // Create scraper directory if it doesn't exist
  const scraperDir = path.join(__dirname, 'src', 'scrapers');
  if (!fs.existsSync(scraperDir)) {
    console.log(`Creating directory: ${scraperDir}`);
    fs.mkdirSync(scraperDir, { recursive: true });
  }
  
  // Create JobFilter if needed
  const jobFilterPath = path.join(utilsDir, 'JobFilter.js');
  if (!fs.existsSync(jobFilterPath)) {
    console.log('JobFilter module not found. Creating a simple version...');
    // Create a simple job filter implementation
    const jobFilterCode = `
      class JobFilter {
        constructor(options = {}) {
          this.options = options;
        }
        
        filterJobs(jobs) {
          if (!Array.isArray(jobs)) return [];
          return jobs.filter(job => {
            const title = (job.title || '').toLowerCase();
            // Basic filter: ignore senior positions
            if (title.includes('senior') || title.includes('manager') || title.includes('director')) {
              return false;
            }
            return true;
          });
        }
      }
      
      module.exports = JobFilter;
    `;
    fs.writeFileSync(jobFilterPath, jobFilterCode);
    console.log(`Created simple JobFilter at ${jobFilterPath}`);
  }
  
  // Try to load or create JobSpyIndeedScraper
  let JobSpyIndeedScraper;
  const scraperPath = path.join(scraperDir, 'JobSpyIndeedScraper.js');
  
  try {
    console.log('Loading JobSpyIndeedScraper...');
    JobSpyIndeedScraper = require('./src/scrapers/JobSpyIndeedScraper');
    console.log('JobSpyIndeedScraper loaded successfully');
  } catch (error) {
    console.warn(`Error loading JobSpyIndeedScraper: ${error.message}`);
    console.log('Creating a basic JobSpyIndeedScraper implementation...');
    
    // Create a basic implementation
    const scraperCode = `
      const axios = require('axios');
      const path = require('path');
      
      class JobSpyIndeedScraper {
        constructor() {
          this.jobspyConfig = {};
          this.queries = [];
          this.location = 'Remote';
          this.country = 'USA';
          this.resultsWanted = 20;
          this.hoursOld = 72;
          this.isRemote = true;
        }
        
        async checkBridgeStatus() {
          try {
            const bridgeUrl = process.env.JOBSPY_BRIDGE_URL || 'http://127.0.0.1:8000';
            const response = await axios.get(\`\${bridgeUrl}/health\`, { timeout: 5000 });
            return response.status === 200;
          } catch (error) {
            console.error(\`Bridge check error: \${error.message}\`);
            return false;
          }
        }
        
        async ensureBridgeRunning() {
          console.log('Checking if bridge is running...');
          let isRunning = await this.checkBridgeStatus();
          
          if (!isRunning) {
            console.log('Bridge is not running, attempting to start it...');
            
            // First try using our Python bridge starter
            try {
              const pythonBridgeStarter = path.join(__dirname, 'python-bridge', 'start-bridge.py');
              
              if (fs.existsSync(pythonBridgeStarter)) {
                console.log(\`Using Python bridge starter: \${pythonBridgeStarter}\`);
                
                // Use the Python script to start the bridge
                const result = require('child_process').execSync(\`python3 "\${pythonBridgeStarter}"\`, { 
                  encoding: 'utf8',
                  stdio: 'inherit'
                });
                
                // Wait a moment for it to start
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Check if it's running now
                isRunning = await this.checkBridgeStatus();
                if (isRunning) {
                  console.log('Successfully started bridge using Python starter');
                  return true;
                }
              }
            } catch (error) {
              console.error(\`Error starting bridge with Python starter: \${error.message}\`);
            }
            
            // If Python starter failed, try direct Python execution
            try {
              console.log('Attempting to start bridge with direct Python command...');
              
              // Detect if we're using a virtual environment
              const venvPython = path.join(__dirname, '.venv', 'bin', 'python3');
              const pythonCommand = fs.existsSync(venvPython) ? venvPython : 'python3';
              
              // Try to start the bridge
              const bridgeScript = path.join(__dirname, 'jobspy_bridge.py');
              
              console.log(\`Running: \${pythonCommand} "\${bridgeScript}"\`);
              
              // Start bridge as a detached process
              const childProcess = spawn(pythonCommand, [bridgeScript], {
                detached: true,
                stdio: 'ignore'
              });
              
              // Unref the child process to let it run independently
              childProcess.unref();
              
              // Wait a moment for it to start
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Check if it's running now
              isRunning = await this.checkBridgeStatus();
              if (isRunning) {
                console.log('Successfully started bridge using direct Python command');
                return true;
              }
            } catch (error) {
              console.error(\`Error starting bridge with direct Python: \${error.message}\`);
            }
          } else {
            console.log('Bridge is already running');
            return true;
          }
          
          return isRunning;
        }
        
        async scrape() {
          try {
            const bridgeUrl = process.env.JOBSPY_BRIDGE_URL || 'http://127.0.0.1:8000';
            console.log(\`Using bridge URL: \${bridgeUrl}\`);
            
            const jobs = [];
            
            for (const query of this.queries) {
              console.log(\`Scraping Indeed for "\${query}" in \${this.location}...\`);
              
              try {
                const payload = {
                  site_name: 'indeed',
                  search_term: query,
                  location: this.location,
                  results_wanted: this.resultsWanted,
                  hours_old: this.hoursOld,
                  is_remote: this.isRemote
                };
                
                console.log(\`Sending request to \${bridgeUrl}/scrape-jobs\`);
                console.log(\`Payload: \${JSON.stringify(payload)}\`);
                
                const response = await axios.post(\`\${bridgeUrl}/scrape-jobs\`, payload, {
                  headers: { 'Content-Type': 'application/json' },
                  timeout: 60000
                });
                
                if (response.status === 200 && response.data) {
                  console.log(\`Received \${response.data.length || 0} jobs for query "\${query}"\`);
                  if (Array.isArray(response.data)) {
                    jobs.push(...response.data);
                  }
                } else {
                  console.warn(\`Unexpected response: \${response.status}\`);
                }
              } catch (queryError) {
                console.error(\`Error scraping query "\${query}": \${queryError.message}\`);
              }
              
              // Wait between queries
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
            
            console.log(\`Total jobs found: \${jobs.length}\`);
            return jobs;
          } catch (error) {
            console.error(\`Scraping error: \${error.message}\`);
            return [];
          }
        }
      }
      
      module.exports = JobSpyIndeedScraper;
    `;
    
    fs.writeFileSync(scraperPath, scraperCode);
    console.log(`Created basic JobSpyIndeedScraper at ${scraperPath}`);
    
    // Now try to load it
    try {
      JobSpyIndeedScraper = require('./src/scrapers/JobSpyIndeedScraper');
      console.log('Created and loaded JobSpyIndeedScraper successfully');
    } catch (loadError) {
      console.error(`Error loading created JobSpyIndeedScraper: ${loadError.message}`);
      throw new Error('Unable to load or create JobSpyIndeedScraper module');
    }
  }
  
  // Set needed environment variables
  if (!process.env.JOBSPY_BRIDGE_URL) {
    console.log('Setting JOBSPY_BRIDGE_URL environment variable');
    process.env.JOBSPY_BRIDGE_URL = 'http://127.0.0.1:8000';
  }
  
  if (!process.env.ENABLE_JOBSPY_INDEED) {
    console.log('Setting ENABLE_JOBSPY_INDEED environment variable');
    process.env.ENABLE_JOBSPY_INDEED = 'true';
  }
  
  // Load any proxies if available
  let proxies = null;
  try {
    const proxiesPath = path.join(__dirname, 'proxies.txt');
    if (fs.existsSync(proxiesPath)) {
      const proxiesData = fs.readFileSync(proxiesPath, 'utf8');
      proxies = proxiesData
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
      
      console.log(`Loaded ${proxies.length} proxies from ${proxiesPath}`);
    }
  } catch (error) {
    console.warn(`Error loading proxies: ${error.message}`);
  }
  
  // Check if Python and Jobspy are properly installed
  async function checkPythonDependencies() {
    console.log('Checking for Python dependencies...');
    
    try {
      // Check if Python is installed
      const pythonVersion = execSync('python3 --version', { encoding: 'utf8' }).trim();
      console.log(`Python version: ${pythonVersion}`);
      
      // Check for virtual environment
      const venvPython = path.join(__dirname, '.venv', 'bin', 'python3');
      const pythonCommand = fs.existsSync(venvPython) ? venvPython : 'python3';
      
      // Check for required packages
      console.log('Checking for required Python packages...');
      try {
        const packages = execSync(`${pythonCommand} -m pip list`, { encoding: 'utf8' });
        const missingPackages = [];
        
        const requiredPackages = ['uvicorn', 'fastapi', 'jobspy'];
        
        for (const pkg of requiredPackages) {
          if (!packages.includes(pkg)) {
            missingPackages.push(pkg);
          }
        }
        
        if (missingPackages.length > 0) {
          console.log(`Missing Python packages: ${missingPackages.join(', ')}`);
          console.log('Attempting to install missing packages...');
          
          execSync(`${pythonCommand} -m pip install ${missingPackages.join(' ')}`, { 
            encoding: 'utf8',
            stdio: 'inherit'
          });
          
          console.log('Successfully installed missing packages');
        } else {
          console.log('All required Python packages are installed');
        }
        
        return true;
      } catch (packagesError) {
        console.error(`Error checking Python packages: ${packagesError.message}`);
        return false;
      }
    } catch (error) {
      console.error(`Error checking Python installation: ${error.message}`);
      return false;
    }
  }
  
  // Create and run the scraper
  async function runScraper() {
    try {
      console.log('Initializing scraper...');
      
      // Check Python dependencies first
      await checkPythonDependencies();
      
      const scraper = new JobSpyIndeedScraper();
      
      // Get search queries from keywords file or use defaults
      let searchQueries = ['remote data entry', 'administrative assistant remote'];
      let searchLocation = 'Remote';
      
      if (keywords && keywords.search_combinations && keywords.search_combinations.length > 0) {
        // Filter to just Indeed searches and extract their search terms
        const indeedSearches = keywords.search_combinations
          .filter(combo => combo.site === 'indeed' || !combo.site)
          .map(combo => ({ term: combo.term, location: combo.location }));
        
        if (indeedSearches.length > 0) {
          // Use the first 5 search combinations to avoid rate limiting
          const limitedSearches = indeedSearches.slice(0, 5);
          searchQueries = limitedSearches.map(search => search.term);
          
          // Use the first non-empty location if available
          const locationSearch = limitedSearches.find(search => search.location);
          if (locationSearch) {
            searchLocation = locationSearch.location;
          }
          
          console.log(`Using ${searchQueries.length} search queries from keywords file`);
        }
      }
      
      // Override default config with our settings
      const scraperConfig = {
        enabled: true,
        queries: searchQueries,
        location: searchLocation,
        country: 'USA',
        resultsWanted: 50,  // Increased to get more results for filtering
        hoursOld: 72,       // Last 3 days
        isRemote: true,
        proxies: proxies
      };
      
      // Apply configuration
      scraper.jobspyConfig = scraperConfig;
      scraper.queries = scraperConfig.queries;
      scraper.location = scraperConfig.location;
      scraper.country = scraperConfig.country;
      scraper.resultsWanted = scraperConfig.resultsWanted;
      scraper.hoursOld = scraperConfig.hoursOld;
      scraper.isRemote = scraperConfig.isRemote;
      
      console.log('Checking bridge status...');
      const bridgeRunning = await scraper.ensureBridgeRunning();
      
      if (!bridgeRunning) {
        throw new Error('Failed to start bridge. Please check Python dependencies and try again.');
      }
      
      console.log('Running Indeed scraper...');
      const jobs = await scraper.scrape();
      
      console.log(`Found ${jobs.length} jobs before filtering`);
      
      // Apply additional filtering
      let filteredJobs = [];
      try {
        const JobFilter = require('./src/utils/JobFilter');
        const jobFilter = new JobFilter({
          keywordsFile: keywordsPath,
          strictMode: true,
          minDescriptionWords: 50
        });
        filteredJobs = jobFilter.filterJobs(jobs);
      } catch (filterError) {
        console.warn(`Error using JobFilter: ${filterError.message}`);
        // Simple filtering fallback
        filteredJobs = jobs.filter(job => {
          const title = (job.title || '').toLowerCase();
          const shouldExclude = keywords.exclude_keywords?.some(kw => 
            title.includes(kw.toLowerCase())
          ) || false;
          return !shouldExclude;
        });
      }
      
      console.log(`Filtered to ${filteredJobs.length} relevant admin/data entry jobs`);
      
      // Save results
      if (filteredJobs.length > 0) {
        console.log('Writing results to indeed-results.json');
        fs.writeFileSync('indeed-results.json', JSON.stringify(filteredJobs, null, 2));
      } else if (jobs.length > 0) {
        console.log('No jobs passed filtering. Saving original jobs for analysis.');
        fs.writeFileSync('indeed-results-unfiltered.json', JSON.stringify(jobs, null, 2));
      }
      
      console.log('=== INDEED SCRAPER COMPLETED ===');
    } catch (error) {
      console.error(`Error in runScraper: ${error.message}`);
      if (error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }
  
  // Run the scraper and handle errors
  runScraper().catch(error => {
    console.error(`ERROR: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    
    // Attempt direct scraping as a last resort
    console.log('Attempting direct scraping fallback...');
    directScrape().catch(fallbackError => {
      console.error(`Fallback scraping failed: ${fallbackError.message}`);
      process.exit(1);
    });
  });
  
  // Direct scraping fallback using axios only
  async function directScrape() {
    console.log('=== STARTING DIRECT INDEED SCRAPING FALLBACK ===');
    try {
      const bridgeUrl = process.env.JOBSPY_BRIDGE_URL || 'http://127.0.0.1:8000';
      const searchTerm = 'remote data entry';
      const location = 'Remote';
      
      // First try to start the bridge directly
      try {
        console.log('Attempting to start the bridge directly...');
        
        // Try using Python directly
        const pythonScriptPath = path.join(__dirname, 'jobspy_bridge.py');
        
        // Detect Python in virtual environment
        const venvPython = path.join(__dirname, '.venv', 'bin', 'python3');
        const pythonCommand = fs.existsSync(venvPython) ? venvPython : 'python3';
        
        // Run the bridge in the background
        const child = spawn(pythonCommand, [pythonScriptPath], {
          detached: true,
          stdio: 'ignore'
        });
        
        // Unref child to allow it to run independently
        child.unref();
        
        // Wait a moment for it to start
        console.log('Waiting for bridge to start...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.warn(`Error starting bridge: ${error.message}`);
      }
      
      console.log(`Making direct request to ${bridgeUrl}/scrape-jobs for "${searchTerm}" in "${location}"`);
      
      const response = await axios.post(`${bridgeUrl}/scrape-jobs`, {
        site_name: 'indeed',
        search_term: searchTerm,
        location: location,
        results_wanted: 20,
        hours_old: 72,
        is_remote: true
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 seconds timeout
      });
      
      if (response.status === 200 && response.data) {
        console.log(`Received ${response.data.length || 0} jobs using direct scraping`);
        
        if (response.data.length > 0) {
          console.log('Writing fallback results to indeed-results-fallback.json');
          fs.writeFileSync('indeed-results-fallback.json', JSON.stringify(response.data, null, 2));
        }
        
        console.log('=== DIRECT SCRAPING FALLBACK COMPLETED ===');
      } else {
        console.warn(`Unexpected response in fallback: ${response.status}`);
        throw new Error(`Fallback received status ${response.status}`);
      }
    } catch (error) {
      console.error(`Error in direct scraping: ${error.message}`);
      
      // Provide helpful error message about Python dependencies
      console.error('\n=== TROUBLESHOOTING GUIDE ===');
      console.error('The scraper is failing because the JobSpy Python bridge cannot be started.');
      console.error('Please make sure the following requirements are met:');
      console.error('1. Python 3.7+ is installed and available as "python3" command');
      console.error('2. Required Python packages are installed:');
      console.error('   - jobspy');
      console.error('   - fastapi');
      console.error('   - uvicorn');
      console.error('\nYou can install these packages with:');
      console.error('pip install jobspy fastapi uvicorn\n');
      console.error('Or with your virtual environment activated:');
      console.error('source .venv/bin/activate && pip install jobspy fastapi uvicorn\n');
      
      throw error;
    }
  }
  
} catch (error) {
  console.error(`Error loading core dependencies: ${error.message}`);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
} 