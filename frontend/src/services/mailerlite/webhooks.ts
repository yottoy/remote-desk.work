import crypto from 'crypto';
import { WebhookEvent } from './types';

export class MailerLiteWebhooks {
  private webhookSecret: string;

  constructor(webhookSecret: string) {
    this.webhookSecret = webhookSecret;
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    const calculatedSignature = hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );
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
    const { subscriber, campaign } = event.data;

    switch (event.event) {
      case 'subscriber.unsubscribed':
        if (handlers.onUnsubscribe) {
          await handlers.onUnsubscribe(subscriber);
        }
        break;
      case 'subscriber.bounced':
        if (handlers.onBounce) {
          await handlers.onBounce(subscriber);
        }
        break;
      case 'subscriber.spam_reported':
        if (handlers.onSpamReport) {
          await handlers.onSpamReport(subscriber);
        }
        break;
      case 'subscriber.removed_from_group':
        if (handlers.onRemovedFromGroup) {
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