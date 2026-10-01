// Pure date logic. Dates are "YYYY-MM-DD" strings in, whole UTC day numbers inside,
// so DST and timezones can't shift a date by one.

export const SUPPLY = 30;     // pills per fill, one a day
export const VALID = 90;      // an Rx expires this many days after it's written
export const CALL_AHEAD = 1;  // call the pharmacy the day before a fill is due
export const BOOK_LEAD = 21;  // ponytail: guess at telehealth booking lead time — tune to your clinic
export const VISIT_EARLY = 7; // visit window opens a week before you'd run out…
export const VISIT_LATE = 2;  // …and closes 2 days before, so the new Rx #1 is at the pharmacy in time

const DAY = 864e5;
export const toDay = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d) / DAY; };
export const toISO = n => new Date(n * DAY).toISOString().slice(0, 10);
export const localToday = (d = new Date()) => toISO(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);

const ISO = /^\d{4}-\d{2}-\d{2}$/;

// Returns an error message, or null if the entry makes sense.
export function validate({ checkIn, lastFill, rx }, today) {
  if (!ISO.test(checkIn || '')) return 'Enter your last check-in date.';
  if (!ISO.test(lastFill || '')) return 'Enter your last refill date.';
  // rx 0 = new scripts written, #1 not filled yet; lastFill is the previous cycle's last refill.
  if (![0, 1, 2, 3].includes(rx)) return 'Pick which Rx you last filled.';
  const c = toDay(checkIn), f = toDay(lastFill), t = toDay(today);
  if (c > t) return 'Check-in date is in the future.';
  if (f > t) return 'Refill date is in the future.';
  if (rx === 0 && f > c) return 'You’ve filled since that check-in, so that refill was Rx #1.';
  if (rx > 0 && f < c) return 'Refill can’t be before the check-in that wrote it. If you haven’t filled the new Rx #1 yet, pick “Old Rx”.';
  if (f > c + VALID) return 'That refill is after these prescriptions expired — log your newer check-in.';
  return null;
}

export function plan({ checkIn, lastFill, rx }, today) {
  const c = toDay(checkIn), f = toDay(lastFill), t = toDay(today);
  const expires = c + VALID;
  // Fill dates for Rx 1–3: past ones are estimates, future ones are projections. Works for rx 0 too.
  const fills = [1, 2, 3].map(n => f + SUPPLY * (n - rx));
  const runOut = fills[2] + SUPPLY; // last day the cycle covers; new Rx #1 is needed by then
  const next = rx < 3 ? { n: rx + 1, due: f + SUPPLY, call: f + SUPPLY - CALL_AHEAD } : null;
  const visit = { bookBy: runOut - BOOK_LEAD, from: runOut - VISIT_EARLY, to: runOut - VISIT_LATE };

  const late = [];
  for (let n = rx + 1; n <= 3; n++) if (fills[n - 1] > expires) late.push(n);

  const target = next ? next.due : runOut;
  return {
    today: t, checkIn: c, lastFill: f, rx, expires, fills, runOut, next, visit, late,
    daysLeft: target - t,                          // headline countdown
    pillsLeft: Math.max(0, Math.min(SUPPLY, SUPPLY - (t - f))),
    cycleDay: t - fills[0],                        // position on the 90-day timeline
    cycleLength: runOut - fills[0],
    expired: t > expires && rx < 3,
  };
}
