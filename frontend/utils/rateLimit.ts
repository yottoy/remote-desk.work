// Simple rate limiting implementation
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5;
const ipRequests = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const requestData = ipRequests.get(ip);

  if (!requestData || now > requestData.resetTime) {
    ipRequests.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (requestData.count >= MAX_REQUESTS) {
    return false;
  }

  requestData.count++;
  return true;
}; 