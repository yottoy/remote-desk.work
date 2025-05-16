import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Get password from request body
  const { password } = req.body;

  // Simple authentication - in production, use a proper auth system
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminSecretToken = process.env.ADMIN_SECRET_TOKEN || crypto.randomBytes(20).toString('hex');

  if (password === adminPassword) {
    // Set cookie for auth
    res.setHeader('Set-Cookie', `admin-token=${adminSecretToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}`);
    
    return res.status(200).json({ 
      success: true,
      token: adminSecretToken
    });
  }

  return res.status(401).json({ 
    success: false,
    message: 'Invalid password'
  });
} 