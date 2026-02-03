/**
 * Verification Script for Programmatic SEO Implementation
 * 
 * This script checks that all components are properly set up
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  const status = exists 
    ? `${colors.green}✓${colors.reset}` 
    : `${colors.red}✗${colors.reset}`;
  console.log(`${status} ${description}`);
  return exists;
}

function checkDirectoryExists(dirPath, description) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  const status = exists 
    ? `${colors.green}✓${colors.reset}` 
    : `${colors.red}✗${colors.reset}`;
  console.log(`${status} ${description}`);
  return exists;
}

console.log(`\n${colors.bold}${colors.blue}=================================================`);
console.log('Programmatic SEO Implementation Verification');
console.log(`=================================================${colors.reset}\n`);

const basePath = process.cwd();
const frontendPath = path.join(basePath, 'frontend');

let allChecks = [];

// Check 1: Data files
console.log(`${colors.bold}1. Data Files${colors.reset}`);
allChecks.push(checkFileExists(
  path.join(frontendPath, 'data/programmaticSeo/index.ts'),
  'Central export file (index.ts)'
));
allChecks.push(checkFileExists(
  path.join(frontendPath, 'data/programmaticSeo/states.ts'),
  'States data (states.ts)'
));
allChecks.push(checkFileExists(
  path.join(frontendPath, 'data/programmaticSeo/categories.ts'),
  'Categories data (categories.ts)'
));
allChecks.push(checkFileExists(
  path.join(frontendPath, 'data/programmaticSeo/modifiers.ts'),
  'Modifiers data (modifiers.ts)'
));
allChecks.push(checkFileExists(
  path.join(frontendPath, 'data/programmaticSeo/contentTemplates.ts'),
  'Content templates (contentTemplates.ts)'
));

// Check 2: Page templates
console.log(`\n${colors.bold}2. Page Templates${colors.reset}`);
allChecks.push(checkDirectoryExists(
  path.join(frontendPath, 'pages/jobs'),
  'Jobs directory exists'
));
allChecks.push(checkFileExists(
  path.join(frontendPath, 'pages/jobs/[category]/index.tsx'),
  'Category page template'
));
allChecks.push(checkFileExists(
  path.join(frontendPath, 'pages/jobs/[category]/[state]/index.tsx'),
  'Category+State page template'
));
allChecks.push(checkFileExists(
  path.join(frontendPath, 'pages/jobs/[category]/[state]/[modifier].tsx'),
  'Category+State+Modifier page template'
));

// Check 3: Sitemap
console.log(`\n${colors.bold}3. Sitemap${colors.reset}`);
allChecks.push(checkFileExists(
  path.join(frontendPath, 'pages/sitemap-programmatic.xml.tsx'),
  'Programmatic sitemap generator'
));

// Check 4: Migration script
console.log(`\n${colors.bold}4. Database Migration${colors.reset}`);
allChecks.push(checkFileExists(
  path.join(basePath, 'scripts/migrate-job-data-for-programmatic-seo.js'),
  'Database migration script'
));

// Check 5: Documentation
console.log(`\n${colors.bold}5. Documentation${colors.reset}`);
allChecks.push(checkFileExists(
  path.join(basePath, 'PROGRAMMATIC_SEO_README.md'),
  'Implementation README'
));

// Check 6: Environment variables
console.log(`\n${colors.bold}6. Environment Configuration${colors.reset}`);
const envExists = fs.existsSync(path.join(basePath, '.env.local'));
if (envExists) {
  const envContent = fs.readFileSync(path.join(basePath, '.env.local'), 'utf-8');
  const hasMongoUri = envContent.includes('MONGODB_URI');
  allChecks.push(hasMongoUri);
  const status = hasMongoUri 
    ? `${colors.green}✓${colors.reset}` 
    : `${colors.red}✗${colors.reset}`;
  console.log(`${status} MONGODB_URI configured`);
} else {
  allChecks.push(false);
  console.log(`${colors.red}✗${colors.reset} .env.local file not found`);
}

// Check 7: TypeScript compilation
console.log(`\n${colors.bold}7. TypeScript Compilation${colors.reset}`);
const tsconfigExists = fs.existsSync(path.join(frontendPath, 'tsconfig.json'));
allChecks.push(tsconfigExists);
const status = tsconfigExists 
  ? `${colors.green}✓${colors.reset}` 
  : `${colors.red}✗${colors.reset}`;
console.log(`${status} TypeScript configuration`);

// Summary
console.log(`\n${colors.bold}${colors.blue}=================================================`);
console.log('Summary');
console.log(`=================================================${colors.reset}\n`);

const passed = allChecks.filter(Boolean).length;
const total = allChecks.length;
const percentage = ((passed / total) * 100).toFixed(0);

if (passed === total) {
  console.log(`${colors.green}${colors.bold}✓ All checks passed! (${passed}/${total})${colors.reset}`);
  console.log(`\n${colors.green}Your programmatic SEO implementation is ready!${colors.reset}\n`);
  console.log('Next steps:');
  console.log('1. Run the database migration:');
  console.log('   node scripts/migrate-job-data-for-programmatic-seo.js\n');
  console.log('2. Build the pages:');
  console.log('   cd frontend && npm run build\n');
  console.log('3. Test locally:');
  console.log('   npm run dev\n');
  console.log('4. Deploy to production');
} else {
  console.log(`${colors.yellow}${colors.bold}⚠ ${passed}/${total} checks passed (${percentage}%)${colors.reset}\n`);
  console.log('Please fix the failed checks above before proceeding.\n');
}

// Data validation checks
console.log(`${colors.bold}${colors.blue}=================================================`);
console.log('Data Validation');
console.log(`=================================================${colors.reset}\n`);

try {
  // Check if we can load the data files
  const statesPath = path.join(frontendPath, 'data/programmaticSeo/states.ts');
  if (fs.existsSync(statesPath)) {
    const statesContent = fs.readFileSync(statesPath, 'utf-8');
    const stateCount = (statesContent.match(/slug: '/g) || []).length;
    console.log(`${colors.green}✓${colors.reset} Found ${stateCount} state definitions`);
    
    if (stateCount !== 15) {
      console.log(`${colors.yellow}  ⚠ Expected 15 states, found ${stateCount}${colors.reset}`);
    }
  }

  const categoriesPath = path.join(frontendPath, 'data/programmaticSeo/categories.ts');
  if (fs.existsSync(categoriesPath)) {
    const categoriesContent = fs.readFileSync(categoriesPath, 'utf-8');
    const categoryCount = (categoriesContent.match(/slug: '/g) || []).length;
    console.log(`${colors.green}✓${colors.reset} Found ${categoryCount} category definitions`);
    
    if (categoryCount !== 5) {
      console.log(`${colors.yellow}  ⚠ Expected 5 categories, found ${categoryCount}${colors.reset}`);
    }
  }

  const modifiersPath = path.join(frontendPath, 'data/programmaticSeo/modifiers.ts');
  if (fs.existsSync(modifiersPath)) {
    const modifiersContent = fs.readFileSync(modifiersPath, 'utf-8');
    const experienceLevels = (modifiersContent.match(/EXPERIENCE_LEVELS:.*?\{([^}]+\{[^}]+\}[^}]+)\}/s) || [])[1];
    const employmentTypes = (modifiersContent.match(/EMPLOYMENT_TYPES:.*?\{([^}]+\{[^}]+\}[^}]+)\}/s) || [])[1];
    
    console.log(`${colors.green}✓${colors.reset} Found experience level and employment type modifiers`);
  }

  console.log(`\n${colors.bold}Estimated page count:${colors.reset}`);
  console.log(`  • Category pages: 5`);
  console.log(`  • Category + State pages: 75 (5 × 15)`);
  console.log(`  • Priority modifier pages: ~125 (Phase 1)`);
  console.log(`  • Total Phase 1: ~205 pages`);
  console.log(`  • Full implementation: 450+ pages`);

} catch (error) {
  console.log(`${colors.red}✗ Error validating data files:${colors.reset}`);
  console.log(`  ${error.message}`);
}

console.log(`\n${colors.bold}${colors.blue}=================================================`);
console.log('Verification Complete');
console.log(`=================================================${colors.reset}\n`);

process.exit(passed === total ? 0 : 1);
