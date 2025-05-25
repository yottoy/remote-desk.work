export * from './types';
export * from './client';
export * from './subscribers';
export * from './campaigns';
export * from './webhooks';
export * from './utils';

import { MailerLiteClient } from './client';
import { MailerLiteSubscribers } from './subscribers';
import { MailerLiteCampaigns } from './campaigns';
import { MailerLiteWebhooks } from './webhooks';
import { MailerLiteConfig } from './types';

export class MailerLite {
  public subscribers: MailerLiteSubscribers;
  public campaigns: MailerLiteCampaigns;
  public webhooks: MailerLiteWebhooks;

  constructor(config: MailerLiteConfig) {
    const client = new MailerLiteClient(config);
    this.subscribers = new MailerLiteSubscribers(client, config.groupId);
    this.campaigns = new MailerLiteCampaigns(client, config.groupId);
    this.webhooks = new MailerLiteWebhooks(config.webhookSecret || '');
  }
} 