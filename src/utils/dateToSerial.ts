export function dateToSerial (date: Date): number {
  // Many timezones are offset in seconds but getTimezoneOffset() returns
  // time "rounded" to minutes so it is basically usable. 😿
  const dt = new Date();
  dt.setUTCFullYear(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  dt.setUTCHours(
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
  // timestamp
  const ts = dt.valueOf();
  if (ts != null && isFinite(ts)) {
    const d = (ts / 864e5);
    return d - (d <= -25509 ? -25568 : -25569);
  }
  return null;
}
