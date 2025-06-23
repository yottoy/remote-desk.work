// Schema validation utilities for ensuring compliance with Google's structured data guidelines

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

export interface SchemaValidationOptions {
  checkRequiredFields: boolean;
  checkDataTypes: boolean;
  checkGoogleGuidelines: boolean;
  strictMode: boolean;
}

/**
 * Validates JobPosting schema against Google's guidelines
 */
export function validateJobPostingSchema(schema: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields check
  const requiredFields = ['@context', '@type', 'title', 'description', 'hiringOrganization'];
  requiredFields.forEach(field => {
    if (!schema[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate @type
  if (schema['@type'] !== 'JobPosting') {
    errors.push('Invalid @type. Must be "JobPosting"');
  }

  // Validate title
  if (schema.title && schema.title.length < 10) {
    warnings.push('Job title should be at least 10 characters long');
  }
  if (schema.title && schema.title.length > 100) {
    warnings.push('Job title should be less than 100 characters');
  }

  // Validate description
  if (schema.description && schema.description.length < 200) {
    warnings.push('Job description should be at least 200 characters long');
  }

  // Validate hiringOrganization
  if (schema.hiringOrganization && !schema.hiringOrganization.name) {
    errors.push('hiringOrganization must have a name property');
  }

  // Validate jobLocation
  if (schema.jobLocation && !schema.jobLocation['@type']) {
    errors.push('jobLocation must have @type property');
  }

  // Validate datePosted format
  if (schema.datePosted && !/^\d{4}-\d{2}-\d{2}$/.test(schema.datePosted)) {
    errors.push('datePosted must be in YYYY-MM-DD format');
  }

  // Validate validThrough format
  if (schema.validThrough && !/^\d{4}-\d{2}-\d{2}$/.test(schema.validThrough)) {
    errors.push('validThrough must be in YYYY-MM-DD format');
  }

  // Validate employmentType
  const validEmploymentTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'TEMPORARY', 'INTERN', 'VOLUNTEER', 'PER_DIEM', 'OTHER'];
  if (schema.employmentType && !validEmploymentTypes.includes(schema.employmentType)) {
    warnings.push(`employmentType should be one of: ${validEmploymentTypes.join(', ')}`);
  }

  const score = calculateValidationScore(errors.length, warnings.length);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score
  };
}

/**
 * Validates Article schema against Google's guidelines
 */
export function validateArticleSchema(schema: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields check
  const requiredFields = ['@context', '@type', 'headline', 'datePublished', 'author', 'publisher'];
  requiredFields.forEach(field => {
    if (!schema[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate @type
  if (schema['@type'] !== 'Article') {
    errors.push('Invalid @type. Must be "Article"');
  }

  // Validate headline length
  if (schema.headline && schema.headline.length > 110) {
    warnings.push('Headline should be 110 characters or less');
  }

  // Validate author structure
  if (schema.author && !schema.author.name) {
    errors.push('Author must have a name property');
  }

  // Validate publisher structure
  if (schema.publisher && !schema.publisher.name) {
    errors.push('Publisher must have a name property');
  }
  if (schema.publisher && !schema.publisher.logo) {
    warnings.push('Publisher should have a logo property');
  }

  // Validate image
  if (schema.image && !schema.image.url) {
    errors.push('Image must have a url property');
  }

  // Validate datePublished format
  if (schema.datePublished && !/^\d{4}-\d{2}-\d{2}$/.test(schema.datePublished)) {
    errors.push('datePublished must be in YYYY-MM-DD format');
  }

  // Validate dateModified format
  if (schema.dateModified && !/^\d{4}-\d{2}-\d{2}$/.test(schema.dateModified)) {
    errors.push('dateModified must be in YYYY-MM-DD format');
  }

  const score = calculateValidationScore(errors.length, warnings.length);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score
  };
}

/**
 * Validates Organization schema
 */
export function validateOrganizationSchema(schema: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields check
  const requiredFields = ['@context', '@type', 'name', 'url'];
  requiredFields.forEach(field => {
    if (!schema[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate @type
  if (schema['@type'] !== 'Organization') {
    errors.push('Invalid @type. Must be "Organization"');
  }

  // Validate URL format
  if (schema.url && !isValidUrl(schema.url)) {
    errors.push('URL must be a valid HTTP/HTTPS URL');
  }

  // Validate logo
  if (schema.logo && !schema.logo.url) {
    errors.push('Logo must have a url property');
  }

  // Validate sameAs URLs
  if (schema.sameAs && Array.isArray(schema.sameAs)) {
    schema.sameAs.forEach((url: string, index: number) => {
      if (!isValidUrl(url)) {
        errors.push(`sameAs[${index}] must be a valid URL`);
      }
    });
  }

  const score = calculateValidationScore(errors.length, warnings.length);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score
  };
}

/**
 * Validates BreadcrumbList schema
 */
export function validateBreadcrumbSchema(schema: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields check
  if (!schema['@context']) errors.push('Missing required field: @context');
  if (!schema['@type']) errors.push('Missing required field: @type');
  if (!schema.itemListElement) errors.push('Missing required field: itemListElement');

  // Validate @type
  if (schema['@type'] !== 'BreadcrumbList') {
    errors.push('Invalid @type. Must be "BreadcrumbList"');
  }

  // Validate itemListElement
  if (schema.itemListElement && Array.isArray(schema.itemListElement)) {
    schema.itemListElement.forEach((item: any, index: number) => {
      if (!item['@type'] || item['@type'] !== 'ListItem') {
        errors.push(`itemListElement[${index}] must have @type: "ListItem"`);
      }
      if (!item.position) {
        errors.push(`itemListElement[${index}] must have position property`);
      }
      if (!item.name) {
        errors.push(`itemListElement[${index}] must have name property`);
      }
      if (!item.item && index < schema.itemListElement.length - 1) {
        warnings.push(`itemListElement[${index}] should have item property (except for last item)`);
      }
    });
  }

  const score = calculateValidationScore(errors.length, warnings.length);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score
  };
}

/**
 * Validates FAQPage schema
 */
export function validateFAQSchema(schema: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields check
  if (!schema['@context']) errors.push('Missing required field: @context');
  if (!schema['@type']) errors.push('Missing required field: @type');
  if (!schema.mainEntity) errors.push('Missing required field: mainEntity');

  // Validate @type
  if (schema['@type'] !== 'FAQPage') {
    errors.push('Invalid @type. Must be "FAQPage"');
  }

  // Validate mainEntity
  if (schema.mainEntity && Array.isArray(schema.mainEntity)) {
    if (schema.mainEntity.length < 2) {
      warnings.push('FAQPage should have at least 2 questions');
    }

    schema.mainEntity.forEach((question: any, index: number) => {
      if (!question['@type'] || question['@type'] !== 'Question') {
        errors.push(`mainEntity[${index}] must have @type: "Question"`);
      }
      if (!question.name) {
        errors.push(`mainEntity[${index}] must have name property`);
      }
      if (!question.acceptedAnswer) {
        errors.push(`mainEntity[${index}] must have acceptedAnswer property`);
      }
      if (question.acceptedAnswer && !question.acceptedAnswer.text) {
        errors.push(`mainEntity[${index}].acceptedAnswer must have text property`);
      }
    });
  }

  const score = calculateValidationScore(errors.length, warnings.length);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score
  };
}

/**
 * Validates WebSite schema
 */
export function validateWebSiteSchema(schema: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields check
  const requiredFields = ['@context', '@type', 'name', 'url'];
  requiredFields.forEach(field => {
    if (!schema[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate @type
  if (schema['@type'] !== 'WebSite') {
    errors.push('Invalid @type. Must be "WebSite"');
  }

  // Validate URL
  if (schema.url && !isValidUrl(schema.url)) {
    errors.push('URL must be a valid HTTP/HTTPS URL');
  }

  // Validate potentialAction (SearchAction)
  if (schema.potentialAction) {
    if (!schema.potentialAction['@type'] || schema.potentialAction['@type'] !== 'SearchAction') {
      errors.push('potentialAction must have @type: "SearchAction"');
    }
    if (!schema.potentialAction.target) {
      errors.push('SearchAction must have target property');
    }
    if (!schema.potentialAction['query-input']) {
      errors.push('SearchAction must have query-input property');
    }
  }

  const score = calculateValidationScore(errors.length, warnings.length);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score
  };
}

/**
 * General schema validator that routes to specific validators
 */
export function validateSchema(schema: any, options: Partial<SchemaValidationOptions> = {}): ValidationResult {
  const defaultOptions: SchemaValidationOptions = {
    checkRequiredFields: true,
    checkDataTypes: true,
    checkGoogleGuidelines: true,
    strictMode: false
  };

  const finalOptions = { ...defaultOptions, ...options };

  if (!schema || typeof schema !== 'object') {
    return {
      valid: false,
      errors: ['Schema must be a valid object'],
      warnings: [],
      score: 0
    };
  }

  // Route to specific validator based on @type
  switch (schema['@type']) {
    case 'JobPosting':
      return validateJobPostingSchema(schema);
    case 'Article':
      return validateArticleSchema(schema);
    case 'Organization':
      return validateOrganizationSchema(schema);
    case 'BreadcrumbList':
      return validateBreadcrumbSchema(schema);
    case 'FAQPage':
      return validateFAQSchema(schema);
    case 'WebSite':
      return validateWebSiteSchema(schema);
    default:
      return {
        valid: false,
        errors: [`Unsupported schema type: ${schema['@type']}`],
        warnings: [],
        score: 0
      };
  }
}

/**
 * Validates multiple schemas and returns aggregated results
 */
export function validateMultipleSchemas(schemas: any[]): {
  overallValid: boolean;
  results: ValidationResult[];
  totalScore: number;
  summary: string;
} {
  const results = schemas.map(schema => validateSchema(schema));
  const overallValid = results.every(result => result.valid);
  const totalScore = Math.round(results.reduce((sum, result) => sum + result.score, 0) / results.length);
  
  const totalErrors = results.reduce((sum, result) => sum + result.errors.length, 0);
  const totalWarnings = results.reduce((sum, result) => sum + result.warnings.length, 0);
  
  let summary = `Validated ${schemas.length} schemas. `;
  summary += `Score: ${totalScore}/100. `;
  summary += `${totalErrors} errors, ${totalWarnings} warnings.`;

  return {
    overallValid,
    results,
    totalScore,
    summary
  };
}

/**
 * Helper function to validate URLs
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

/**
 * Calculate validation score based on errors and warnings
 */
function calculateValidationScore(errorCount: number, warningCount: number): number {
  if (errorCount > 0) {
    return Math.max(0, 100 - (errorCount * 25) - (warningCount * 5));
  }
  return Math.max(0, 100 - (warningCount * 10));
}

/**
 * Generate validation report for debugging
 */
export function generateValidationReport(schemas: any[]): string {
  const validation = validateMultipleSchemas(schemas);
  
  let report = `=== Schema Validation Report ===\n`;
  report += `${validation.summary}\n\n`;
  
  validation.results.forEach((result, index) => {
    const schema = schemas[index];
    report += `Schema ${index + 1} (${schema['@type']}): `;
    report += result.valid ? 'VALID' : 'INVALID';
    report += ` (Score: ${result.score}/100)\n`;
    
    if (result.errors.length > 0) {
      report += `  Errors:\n`;
      result.errors.forEach(error => {
        report += `    - ${error}\n`;
      });
    }
    
    if (result.warnings.length > 0) {
      report += `  Warnings:\n`;
      result.warnings.forEach(warning => {
        report += `    - ${warning}\n`;
      });
    }
    
    report += '\n';
  });
  
  return report;
}

/**
 * Test all schema generators with sample data
 */
export function testSchemaGenerators(): string {
  // This function would test all the schema generators
  // Implementation would depend on having access to the generator functions
  return 'Schema generator tests would run here in development mode';
} 