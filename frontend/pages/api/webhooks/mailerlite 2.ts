import { NextApiRequest, NextApiResponse } from 'next';
import { MailerLite } from '../../../services/mailerlite';
import { mailerLiteConfig } from '../../../config/mailerlite';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const signature = req.headers['x-mailerlite-signature'] as string;
    if (!signature) {
      return res.status(401).json({ message: 'Missing signature' });
    }

    const mailerLite = new MailerLite(mailerLiteConfig);
    const payload = JSON.stringify(req.body);

    await mailerLite.webhooks.handleWebhook(payload, signature, {
      onUnsubscribe: async (subscriber) => {
        // Update subscriber status in your database
        console.log(`Subscriber unsubscribed: ${subscriber.email}`);
      },
      onBounce: async (subscriber) => {
        // Handle bounced emails
        console.log(`Email bounced: ${subscriber.email}`);
      },
      onSpamReport: async (subscriber) => {
        // Handle spam reports
        console.log(`Spam reported: ${subscriber.email}`);
      },
      onRemovedFromGroup: async (subscriber) => {
        // Handle removal from group
        console.log(`Removed from group: ${subscriber.email}`);
      },
      onCampaignSent: async (data) => {
        // Track campaign sends
        console.log(`Campaign sent: ${data.campaign?.name}`);
      },
      onCampaignOpen: async (data) => {
        // Track email opens
        console.log(`Campaign opened: ${data.campaign?.name} by ${data.subscriber.email}`);
      },
      onCampaignClick: async (data) => {
        // Track link clicks
        console.log(`Campaign clicked: ${data.campaign?.name} by ${data.subscriber.email}`);
      },
    });

    return res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(400).json({ message: 'Error processing webhook' });
  }
} 