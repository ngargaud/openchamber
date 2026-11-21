const BROKER_SCHEME = /^[a-z]+:\/\//i;

export const normalizeBrokerUrl = (value: string | null | undefined): string | null => {
  const raw = value?.trim() ?? '';
  if (!raw) return null;
  if (BROKER_SCHEME.test(raw)) return raw;
  return `mqtt://${raw}`;
};
