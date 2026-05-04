export function parseTimeToSerial (ts: string): number {
  const match = /^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?(\.\d+)?$/.exec(ts);
  if (match) {
    const [ , h, m, s, f ] = match;
    return (+h / 24) + // hours
           (Number(m) / 1440) + // minutes
           (Number(s + (f || '')) / 86400); // seconds with fraction
  }
  return 0;
}
