import { canonicalizeTimezone } from '@/lib/timezones';

export const TIMEZONE_OPTIONS = (() => {
  if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
    return [...new Set(Intl.supportedValuesOf('timeZone').map(canonicalizeTimezone))];
  }
  return [
    'UTC',
    'Europe/Kyiv',
    'Europe/London',
    'Europe/Berlin',
    'America/New_York',
    'America/Los_Angeles',
    'Asia/Tokyo',
  ];
})();
