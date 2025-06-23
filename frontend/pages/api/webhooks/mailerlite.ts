import { NextApiRequest, NextApiResponse } from 'next';
import { MailerLite } from '../../../services/mailerlite';
import { mailerLiteConfig } from '../../../config/mailerlite';

// Store processed webhook IDs to prevent duplicate processing
const processedWebhooks = new Set<string>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if webhook secret is configured
    if (!process.env.MAILERLITE_WEBHOOK_SECRET) {
      console.error('MAILERLITE_WEBHOOK_SECRET not configured');
      // Return 200 to prevent MailerLite retries for configuration issues
      return res.status(200).json({ message: 'Webhook secret not configured' });
    }

    // Get the signature from headers - MailerLite sends it as 'Signature'
    const signature = req.headers.signature as string;
    
    if (!signature) {
      console.log('No signature provided in webhook request');
      // Return 200 to prevent MailerLite retries
      return res.status(200).json({ message: 'Missing signature' });
    }

    // Get the raw body
    const payload = JSON.stringify(req.body);
    
    // Create webhook ID for idempotency (using timestamp + signature)
    const webhookId = `${Date.now()}-${signature.slice(-8)}`;
    
    if (processedWebhooks.has(webhookId)) {
      console.log(`Webhook ${webhookId} already processed, skipping`);
      return res.status(200).json({ message: 'Webhook already processed' });
    }

    // Verify webhook signature
    const mailerLite = new MailerLite(mailerLiteConfig);

    const isValidSignature = mailerLite.webhooks.verifyWebhookSignature(payload, signature);
    
    if (!isValidSignature) {
      console.error('Webhook signature verification failed');
      // Still return 200 to prevent MailerLite retries
      return res.status(200).json({ message: 'Webhook signature verification failed' });
    }

    // Mark webhook as processed
    processedWebhooks.add(webhookId);

    // Process the webhook event
    const event = req.body;
    console.log('Processing webhook event:', event.event || event.type);

    // Handle different event types
    switch (event.event || event.type) {
      case 'subscriber.created':
        console.log('New subscriber created:', event.data?.subscriber?.email || event.email);
        break;
      case 'subscriber.updated':
        console.log('Subscriber updated:', event.data?.subscriber?.email || event.email);
        break;
      case 'subscriber.unsubscribed':
        console.log('Subscriber unsubscribed:', event.data?.subscriber?.email || event.email);
        break;
      case 'campaign.sent':
        console.log('Campaign sent:', event.data?.campaign?.name || event.name);
        break;
      default:
        console.log('Unhandled webhook event type:', event.event || event.type);
    }

    // Clean up old processed webhooks (keep only last 1000)
    if (processedWebhooks.size > 1000) {
      const webhooksArray = Array.from(processedWebhooks);
      const toDelete = webhooksArray.slice(0, webhooksArray.length - 1000);
      toDelete.forEach(id => processedWebhooks.delete(id));
    }

    return res.status(200).json({ 
      message: 'Webhook processed successfully',
      event: event.event || event.type,
      webhookId 
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 even on error to prevent MailerLite retries
    return res.status(200).json({ 
      message: 'Webhook processing error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 