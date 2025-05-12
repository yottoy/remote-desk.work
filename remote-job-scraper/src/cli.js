#!/usr/bin/env node

const logger = require('./utils/logger');
const database = require('./utils/database');
const qualityFilter = require('./utils/qualityFilter');
const WeWorkRemotelyScraper = require('./scrapers/WeWorkRemotelyScraper');
const RemoteCoScraper = require('./scrapers/RemoteCoScraper');
const IndeedScraper = require('./scrapers/IndeedScraper');
const fs = require('fs');
const path = require('path');

// Available scrapers
const scrapers = {
  'weworkremotely': WeWorkRemotelyScraper,
  'remoteco': RemoteCoScraper,
  'indeed': IndeedScraper
};

/**
 * Display help message
 */
function showHelp() {
  console.log(`
Remote Job Scraper CLI

Usage:
  node cli.js [options] [command]

Commands:
  list                   List available scrapers
  run <scraper>          Run a specific scraper
  run-all                Run all scrapers
  help                   Show this help message

Options:
  --no-save              Run without saving to database
  --output <file>        Save results to a JSON file
  --verbose              Enable verbose logging

Examples:
  node cli.js list
  node cli.js run weworkremotely
  node cli.js run-all --no-save --output=results.json
  `);
}

/**
 * List available scrapers
 */
function listScrapers() {
  console.log('Available scrapers:');
  Object.keys(scrapers).forEach(name => {
    console.log(`  - ${name}`);
  });
}

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    command: null,
    scraper: null,
    options: {
      save: true,
      output: null,
      verbose: false
    }
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      // Handle options
      if (arg === '--no-save') {
        parsed.options.save = false;
      } else if (arg.startsWith('--output=')) {
        parsed.options.output = arg.split('=')[1];
      } else if (arg === '--verbose') {
        parsed.options.verbose = true;
      }
    } else if (!parsed.command) {
      // First non-option argument is the command
      parsed.command = arg;
    } else if (parsed.command === 'run' && !parsed.scraper) {
      // Second argument after 'run' is the scraper name
      parsed.scraper = arg;
    }
  }

  return parsed;
}

/**
 * Run a specific scraper
 * @param {string} scraperName - Name of the scraper to run
 * @param {Object} options - Command options
 */
async function runScraper(scraperName, options) {
  try {
    if (!scrapers[scraperName]) {
      console.error(`Error: Scraper '${scraperName}' not found. Use 'list' to see available scrapers.`);
      process.exit(1);
    }

    // Set logging level based on verbose option
    if (options.verbose) {
      logger.level = 'debug';
    }

    logger.info(`Running '${scraperName}' scraper...`);

    // Initialize scraper
    const ScraperClass = scrapers[scraperName];
    const scraper = new ScraperClass();

    // Connect to database if saving is enabled
    if (options.save) {
      await database.connect();
    }

    // Run the scraper
    const jobs = await scraper.scrape();
    logger.info(`Scraped ${jobs.length} jobs from ${scraperName}`);

    // Filter jobs
    const filteredJobs = qualityFilter.filterJobs(jobs);
    logger.info(`Filtered down to ${filteredJobs.length} quality jobs`);

    // Save to database if enabled
    if (options.save && filteredJobs.length > 0) {
      const result = await database.bulkSaveJobs(filteredJobs);
      logger.info(`Saved ${result.inserted} new jobs, updated ${result.updated} existing jobs`);
    }

    // Save to output file if specified
    if (options.output) {
      const outputData = options.save ? filteredJobs : jobs;
      fs.writeFileSync(
        options.output,
        JSON.stringify(outputData, null, 2)
      );
      logger.info(`Results saved to ${options.output}`);
    }

    // Close database connection if opened
    if (options.save) {
      await database.disconnect();
    }

    logger.info('Done!');
  } catch (error) {
    logger.error(`Error running scraper: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Run all scrapers
 * @param {Object} options - Command options
 */
async function runAllScrapers(options) {
  try {
    // Set logging level based on verbose option
    if (options.verbose) {
      logger.level = 'debug';
    }

    logger.info('Running all scrapers...');

    // Connect to database if saving is enabled
    if (options.save) {
      await database.connect();
    }

    const allJobs = [];
    const scraperNames = Object.keys(scrapers);

    // Run each scraper
    for (const name of scraperNames) {
      try {
        logger.info(`Running '${name}' scraper...`);

        // Initialize scraper
        const ScraperClass = scrapers[name];
        const scraper = new ScraperClass();

        // Run the scraper
        const jobs = await scraper.scrape();
        logger.info(`Scraped ${jobs.length} jobs from ${name}`);

        // Add to all jobs
        allJobs.push(...jobs);
      } catch (error) {
        logger.error(`Error running '${name}' scraper: ${error.message}`);
        // Continue with next scraper
      }
    }

    logger.info(`Total jobs scraped: ${allJobs.length}`);

    // Filter jobs
    const filteredJobs = qualityFilter.filterJobs(allJobs);
    logger.info(`Filtered down to ${filteredJobs.length} quality jobs`);

    // Save to database if enabled
    if (options.save && filteredJobs.length > 0) {
      const result = await database.bulkSaveJobs(filteredJobs);
      logger.info(`Saved ${result.inserted} new jobs, updated ${result.updated} existing jobs`);
    }

    // Save to output file if specified
    if (options.output) {
      const outputData = options.save ? filteredJobs : allJobs;
      fs.writeFileSync(
        options.output,
        JSON.stringify(outputData, null, 2)
      );
      logger.info(`Results saved to ${options.output}`);
    }

    // Close database connection if opened
    if (options.save) {
      await database.disconnect();
    }

    logger.info('Done!');
  } catch (error) {
    logger.error(`Error running scrapers: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Main CLI function
 */
async function main() {
  const args = parseArgs();

  switch (args.command) {
    case 'list':
      listScrapers();
      break;
    
    case 'run':
      if (!args.scraper) {
        console.error('Error: No scraper specified. Use the format: run <scraper>');
        showHelp();
        process.exit(1);
      }
      await runScraper(args.scraper, args.options);
      break;
    
    case 'run-all':
      await runAllScrapers(args.options);
      break;
    
    case 'help':
      showHelp();
      break;
    
    default:
      console.error(`Error: Unknown command '${args.command || ''}'`);
      showHelp();
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { main }; 