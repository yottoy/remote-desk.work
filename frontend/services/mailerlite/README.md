# MailerLite Integration

This module provides a complete integration with the MailerLite API for managing subscribers, campaigns, and webhooks.

## Setup

1. Install the required dependencies:
```bash
npm install axios crypto
```

2. Configure environment variables:
```env
MAILERLITE_API_KEY=your_api_key
MAILERLITE_GROUP_ID=your_group_id
MAILERLITE_WEBHOOK_SECRET=your_webhook_secret
```

## Usage

### Basic Setup

```typescript
import { MailerLite } from './services/mailerlite';

const mailerLite = new MailerLite({
  apiKey: process.env.MAILERLITE_API_KEY!,
  groupId: process.env.MAILERLITE_GROUP_ID!,
  baseUrl: 'https://api.mailerlite.com/api/v2',
  webhookSecret: process.env.MAILERLITE_WEBHOOK_SECRET,
});
```

### Subscriber Management

```typescript
// Add a new subscriber
await mailerLite.subscribers.addSubscriber({
  email: 'user@example.com',
  name: 'John Doe',
  fields: {
    company: 'Acme Inc',
    role: 'Developer',
  },
});

// Update subscriber
await mailerLite.subscribers.updateSubscriber('user@example.com', {
  name: 'John Smith',
});

// Remove subscriber
await mailerLite.subscribers.removeSubscriber('user@example.com');

// Batch process subscribers
await mailerLite.subscribers.batchProcess([
  {
    operation: 'create',
    subscribers: [
      { email: 'user1@example.com' },
      { email: 'user2@example.com' },
    ],
  },
]);
```

### Campaign Management

```typescript
// Create and send a weekly digest
const campaign = await mailerLite.campaigns.createWeeklyDigest(
  'Weekly Job Digest',
  'New Jobs This Week',
  '<h1>New Jobs</h1><p>Check out these new opportunities...</p>',
  '2024-03-20T10:00:00Z'
);

// Get campaign statistics
const stats = await mailerLite.campaigns.getCampaignStats(campaign.id);
```

### Webhook Handling

```typescript
// Handle webhook events
await mailerLite.webhooks.handleWebhook(
  payload,
  signature,
  {
    onUnsubscribe: async (subscriber) => {
      // Handle unsubscribe event
      await updateSubscriberStatus(subscriber.email, 'unsubscribed');
    },
    onBounce: async (subscriber) => {
      // Handle bounce event
      await updateSubscriberStatus(subscriber.email, 'bounced');
    },
  }
);
```

## Error Handling

The integration includes built-in error handling and retry logic:

```typescript
import { withRetry, formatError } from './services/mailerlite';

try {
  await withRetry(() => mailerLite.subscribers.addSubscriber({
    email: 'user@example.com',
  }));
} catch (error) {
  console.error(formatError(error));
}
```

## Rate Limiting

The integration automatically handles rate limiting with exponential backoff retry logic. The default configuration:
- Maximum retries: 3
- Initial delay: 1 second
- Maximum delay: 10 seconds
- Backoff factor: 2

## Best Practices

1. Always validate email addresses before adding subscribers
2. Use batch operations for bulk subscriber management
3. Implement proper error handling and logging
4. Monitor campaign statistics and subscriber engagement
5. Keep webhook handlers idempotent
6. Use environment variables for sensitive configuration
7. Implement proper error recovery mechanisms 