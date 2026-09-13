const LOCAL_API_PREFIX = 'api/v1';
const VERCEL_API_PREFIX = 'v1';

export function getApiPrefix(isVercel = process.env.VERCEL === '1') {
  return isVercel ? VERCEL_API_PREFIX : LOCAL_API_PREFIX;
}
