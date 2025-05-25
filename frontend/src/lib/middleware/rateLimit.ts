import { NextApiRequest, NextApiResponse } from 'next';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5; // 5 requests per minute

export function rateLimit() {
  return async function rateLimitMiddleware(
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => void
  ) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const key = `rate-limit:${ip}`;
    const now = Date.now();

    // Clean up expired entries
    Object.keys(store).forEach((k) => {
      if (store[k].resetTime < now) {
        delete store[k];
      }
    });

    // Initialize or get current rate limit data
    if (!store[key]) {
      store[key] = {
        count: 0,
        resetTime: now + WINDOW_MS
      };
    }

    // Check if rate limit is exceeded
    if (store[key].count >= MAX_REQUESTS) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      });
    }

    // Increment request count
    store[key].count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - store[key].count);
    res.setHeader('X-RateLimit-Reset', store[key].resetTime);

    next();
  };
} 