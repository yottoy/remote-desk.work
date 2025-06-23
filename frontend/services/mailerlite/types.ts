export interface MailerLiteConfig {
  apiKey: string;
  groupId: string;
  baseUrl: string;
  webhookSecret?: string;
}

export interface Subscriber {
  email: string;
  name?: string;
  fields?: Record<string, string>;
  status?: 'active' | 'unsubscribed' | 'bounced' | 'junk';
  subscribed_at?: string;
  unsubscribed_at?: string;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent';
  scheduled_at?: string;
  sent_at?: string;
}

export interface WebhookEvent {
  event: string;
  data: {
    subscriber: Subscriber;
    campaign?: Campaign;
    timestamp: string;
  };
}

export interface MailerLiteError {
  code: string;
  message: string;
  status: number;
}

export interface BatchOperation {
  subscribers: Subscriber[];
  operation: 'create' | 'update' | 'delete';
} 