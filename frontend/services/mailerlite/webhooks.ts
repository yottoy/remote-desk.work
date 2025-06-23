import crypto from 'crypto';
import { WebhookEvent } from './types';

export class MailerLiteWebhooks {
  private webhookSecret: string;

  constructor(webhookSecret: string) {
    this.webhookSecret = webhookSecret;
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Handle case where webhook secret is not configured
    if (!this.webhookSecret) {
      console.error('Webhook secret not configured');
      return false;
    }

    try {
      // MailerLite sends signature in format "sha256=<hash>"
      const expectedSignature = signature.startsWith('sha256=') 
        ? signature.slice(7) // Remove "sha256=" prefix
        : signature;

      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      const calculatedSignature = hmac.update(payload, 'utf8').digest('hex');
      
      // Use timing-safe comparison
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(calculatedSignature, 'hex')
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  parseWebhookEvent(payload: string): WebhookEvent {
    try {
      const event = JSON.parse(payload) as WebhookEvent;
      return event;
    } catch (error) {
      throw new Error('Invalid webhook payload');
    }
  }

  async handleWebhook(
    payload: string,
    signature: string,
    handlers: {
      onUnsubscribe?: (subscriber: WebhookEvent['data']['subscriber']) => Promise<void>;
      onBounce?: (subscriber: WebhookEvent['data']['subscriber']) => Promise<void>;
      onSpamReport?: (subscriber: WebhookEvent['data']['subscriber']) => Promise<void>;
      onRemovedFromGroup?: (subscriber: WebhookEvent['data']['subscriber']) => Promise<void>;
      onCampaignSent?: (data: WebhookEvent['data']) => Promise<void>;
      onCampaignOpen?: (data: WebhookEvent['data']) => Promise<void>;
      onCampaignClick?: (data: WebhookEvent['data']) => Promise<void>;
    }
  ): Promise<void> {
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }

    const event = this.parseWebhookEvent(payload);
    
    // Handle case where event data might be missing
    if (!event.data) {
      console.log('Webhook event has no data, skipping');
      return;
    }

    const { subscriber, campaign } = event.data;

    switch (event.event) {
      case 'subscriber.unsubscribed':
        if (handlers.onUnsubscribe && subscriber) {
          await handlers.onUnsubscribe(subscriber);
        }
        break;
      case 'subscriber.bounced':
        if (handlers.onBounce && subscriber) {
          await handlers.onBounce(subscriber);
        }
        break;
      case 'subscriber.spam_reported':
        if (handlers.onSpamReport && subscriber) {
          await handlers.onSpamReport(subscriber);
        }
        break;
      case 'subscriber.removed_from_group':
        if (handlers.onRemovedFromGroup && subscriber) {
          await handlers.onRemovedFromGroup(subscriber);
        }
        break;
      case 'campaign.sent':
        if (handlers.onCampaignSent) {
          await handlers.onCampaignSent(event.data);
        }
        break;
      case 'campaign.open':
        if (handlers.onCampaignOpen) {
          await handlers.onCampaignOpen(event.data);
        }
        break;
      case 'campaign.click':
        if (handlers.onCampaignClick) {
          await handlers.onCampaignClick(event.data);
        }
        break;
      default:
        // Log unhandled events for monitoring
        console.log(`Unhandled webhook event: ${event.event}`);
        break;
    }
  }
} 