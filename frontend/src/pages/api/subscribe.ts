import { NextApiRequest, NextApiResponse } from 'next';
import { MailerLite } from '../../services/mailerlite';
import { mailerLiteConfig } from '../../config/mailerlite';
import { isValidEmail } from '../../utils/validation';
import { checkRateLimit } from '../../utils/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if required environment variables are present
    if (!process.env.MAILERLITE_API_KEY) {
      console.error('MAILERLITE_API_KEY is not set');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    if (!process.env.MAILERLITE_GROUP_ID) {
      console.error('MAILERLITE_GROUP_ID is not set');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Get client IP
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({ error: 'Could not determine client IP' });
    }

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Too many requests, please try again later' });
    }

    const { email, source } = req.body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Validate source
    if (!source) {
      return res.status(400).json({ error: 'Source is required' });
    }

    // Initialize MailerLite client
    const mailerLite = new MailerLite(mailerLiteConfig);

    // Add subscriber
    await mailerLite.subscribers.addSubscriber({
      email,
      fields: {
        source,
        subscribed_at: new Date().toISOString()
      }
    });

    // Track successful subscription
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // @ts-ignore
      window.gtag('event', 'email_subscription', {
        'email': email,
        'source': source,
        'value': 1
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ error: 'Failed to subscribe' });
  }
} 