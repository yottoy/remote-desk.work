import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log webhook test request
    console.log('Webhook test request received');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Check environment variables
    const envStatus = {
      MAILERLITE_API_KEY: !!process.env.MAILERLITE_API_KEY,
      MAILERLITE_GROUP_ID: !!process.env.MAILERLITE_GROUP_ID,
      MAILERLITE_WEBHOOK_SECRET: !!process.env.MAILERLITE_WEBHOOK_SECRET,
    };

    console.log('Environment variables status:', envStatus);

    // Test webhook signature if provided
    const signature = req.headers['x-mailerlite-signature'] as string;
    if (signature && process.env.MAILERLITE_WEBHOOK_SECRET) {
      const crypto = require('crypto');
      const payload = JSON.stringify(req.body);
      
      // Test signature verification
      const expectedSignature = signature.startsWith('sha256=') 
        ? signature.slice(7) 
        : signature;

      const hmac = crypto.createHmac('sha256', process.env.MAILERLITE_WEBHOOK_SECRET);
      const calculatedSignature = hmac.update(payload, 'utf8').digest('hex');
      
      const signatureValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(calculatedSignature, 'hex')
      );

      console.log('Signature verification:', {
        provided: expectedSignature,
        calculated: calculatedSignature,
        valid: signatureValid
      });

      return res.status(200).json({
        message: 'Webhook test completed',
        envStatus,
        signatureValid,
        hasSignature: !!signature,
        hasSecret: !!process.env.MAILERLITE_WEBHOOK_SECRET
      });
    }

    return res.status(200).json({
      message: 'Webhook test completed (no signature verification)',
      envStatus,
      hasSignature: !!signature,
      hasSecret: !!process.env.MAILERLITE_WEBHOOK_SECRET
    });

  } catch (error) {
    console.error('Webhook test error:', error);
    return res.status(500).json({
      error: 'Webhook test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 