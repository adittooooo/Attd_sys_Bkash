/**
 * Bangladesh Standard Time (BST = UTC+6) Date and Time Utilities
 */

/**
 * Parses an ISO timestamp string or Date object into Bangladesh Standard Time (Asia/Dhaka)
 */
export function parseISOToBDDateTime(isoStr: string): { date: string; time24: string; time12: string } {
  try {
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) {
      // Date YYYY-MM-DD in Asia/Dhaka
      const formatterDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const date = formatterDate.format(d);

      // Time 24h HH:mm:ss in Asia/Dhaka
      const formatter24 = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const time24 = formatter24.format(d);

      // Time 12h hh:mm:ss AM/PM in Asia/Dhaka
      const formatter12 = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      const time12 = formatter12.format(d);

      return { date, time24, time12 };
    }
  } catch (_) {}

  return { date: '', time24: '09:00:00', time12: '09:00 AM' };
}

/**
 * Formats any time string or ISO string into Bangladesh Standard Time.
 * @param timeStr - e.g. "08:52:10", "17:05", "2026-07-30T01:33:15Z", "08:52 AM"
 * @param use12Hour - if true, returns "08:52 AM" / "05:05 PM", else returns "08:52" / "17:05"
 */
export function formatToBDTime(timeStr: string | undefined, use12Hour: boolean = false): string {
  if (!timeStr) return '—';

  // If timeStr is an ISO timestamp string with 'T'
  if (timeStr.includes('T')) {
    const parsed = parseISOToBDDateTime(timeStr);
    if (use12Hour) {
      return parsed.time12.replace(/(:\d{2})(?=\s[AP]M)/, '');
    }
    return parsed.time24.slice(0, 5);
  }

  // If timeStr already has AM or PM
  if (/am|pm/i.test(timeStr)) {
    if (!use12Hour) {
      const match = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)/i);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = match[2];
        const period = match[4].toUpperCase();
        if (period === 'PM' && h < 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${m}`;
      }
    }
    return timeStr.toUpperCase();
  }

  // If timeStr is a 24-hr string like "08:52:10" or "14:30"
  const parts = timeStr.trim().split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].slice(0, 2);
    if (isNaN(hours)) return timeStr;

    if (use12Hour) {
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${String(hours).padStart(2, '0')}:${minutes} ${period}`;
    } else {
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
  }

  return timeStr;
}

/**
 * Returns current timestamp formatted according to Bangladesh Standard Time (BST)
 * e.g. "30/07/2026, 11:30 AM (BST)"
 */
export function getBDCurrentTimestamp(): string {
  const now = new Date();
  try {
    const dateStr = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dhaka',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(now); // "30/07/2026"

    const timeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(now); // "11:30 AM"

    return `${dateStr}, ${timeStr} (BST)`;
  } catch (_) {
    return now.toLocaleString();
  }
}
