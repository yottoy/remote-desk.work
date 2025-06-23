import { MailerLiteConfig } from '../services/mailerlite';

// Validate required environment variables
const requiredEnvVars = {
  MAILERLITE_API_KEY: process.env.MAILERLITE_API_KEY,
  MAILERLITE_GROUP_ID: process.env.MAILERLITE_GROUP_ID,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Optional environment variables
const optionalEnvVars = {
  MAILERLITE_WEBHOOK_SECRET: process.env.MAILERLITE_WEBHOOK_SECRET,
};

// Log configuration status (without exposing secrets)
console.log('MailerLite configuration:', {
  apiKeyConfigured: !!process.env.MAILERLITE_API_KEY,
  groupIdConfigured: !!process.env.MAILERLITE_GROUP_ID,
  webhookSecretConfigured: !!process.env.MAILERLITE_WEBHOOK_SECRET,
});

export const mailerLiteConfig: MailerLiteConfig = {
  apiKey: requiredEnvVars.MAILERLITE_API_KEY!,
  groupId: requiredEnvVars.MAILERLITE_GROUP_ID!,
  baseUrl: 'https://connect.mailerlite.com/api',
  webhookSecret: optionalEnvVars.MAILERLITE_WEBHOOK_SECRET,
}; 