import { MailerLiteConfig } from '../services/mailerlite';

if (!process.env.MAILERLITE_API_KEY) {
  throw new Error('MAILERLITE_API_KEY is not defined in environment variables');
}

if (!process.env.MAILERLITE_GROUP_ID) {
  throw new Error('MAILERLITE_GROUP_ID is not defined in environment variables');
}

export const mailerLiteConfig: MailerLiteConfig = {
  apiKey: process.env.MAILERLITE_API_KEY,
  groupId: process.env.MAILERLITE_GROUP_ID,
  baseUrl: 'https://connect.mailerlite.com/api',
  webhookSecret: process.env.MAILERLITE_WEBHOOK_SECRET,
}; 