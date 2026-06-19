/** Locale-aware "X ago" using the platform Intl.RelativeTimeFormat (en + vi). */
export function relativeTime(iso: string, lang: string): string {
  const diffMs = Date.parse(iso) - Date.now();
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const abs = Math.abs(diffMs);
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  if (abs < HOUR) return rtf.format(Math.round(diffMs / MIN), 'minute');
  if (abs < DAY) return rtf.format(Math.round(diffMs / HOUR), 'hour');
  if (abs < WEEK) return rtf.format(Math.round(diffMs / DAY), 'day');
  return rtf.format(Math.round(diffMs / WEEK), 'week');
}
