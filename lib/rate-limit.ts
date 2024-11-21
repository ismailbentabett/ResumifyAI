import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

if (
  !process.env.UPSTASH_REDIS_REST_URL ||
  !process.env.UPSTASH_REDIS_REST_TOKEN
) {
  throw new Error('Redis credentials are not properly configured');
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Create a new ratelimiter that allows 5 requests per 24 hours
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(3, '1 h'),
  analytics: true,
});
