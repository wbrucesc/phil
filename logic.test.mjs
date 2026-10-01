import assert from 'node:assert/strict';
import { plan, validate, toDay, toISO, localToday } from './logic.js';

const iso = n => toISO(n);

// The real example: check-in and Rx #1 filled Tue 9/29/26, viewed Thu 10/1.
const entry = { checkIn: '2026-09-29', lastFill: '2026-09-29', rx: 1 };
let p = plan(entry, '2026-10-01');
assert.equal(validate(entry, '2026-10-01'), null);
assert.equal(iso(p.next.due), '2026-10-29');
assert.equal(iso(p.next.call), '2026-10-28');
assert.equal(p.next.n, 2);
assert.equal(p.daysLeft, 28);
assert.equal(p.pillsLeft, 28);
assert.equal(iso(p.fills[2]), '2026-11-28');
assert.equal(iso(p.runOut), '2026-12-28');
assert.equal(iso(p.expires), '2026-12-28');
assert.equal(p.runOut, p.expires);      // cycle and Rx validity line up when fills are on time
assert.equal(iso(p.visit.bookBy), '2026-12-07');
assert.equal(iso(p.visit.from), '2026-12-21');
assert.equal(iso(p.visit.to), '2026-12-26');
assert.deepEqual(p.late, []);
assert.equal(p.expired, false);

// Rx #2 picked up on time.
p = plan({ ...entry, lastFill: '2026-10-29', rx: 2 }, '2026-11-01');
assert.equal(p.next.n, 3);
assert.equal(iso(p.next.due), '2026-11-28');
assert.equal(p.daysLeft, 27);

// Rx #3: no next fill in this cycle; countdown is to run-out.
p = plan({ ...entry, lastFill: '2026-11-28', rx: 3 }, '2026-12-08');
assert.equal(p.next, null);
assert.equal(iso(p.runOut), '2026-12-28');
assert.equal(p.daysLeft, 20);
assert.ok(p.today > p.visit.bookBy);

// Overdue: fill #2 was due 10/29, now 11/2.
p = plan(entry, '2026-11-02');
assert.equal(p.daysLeft, -4);
assert.equal(p.pillsLeft, 0);

// Drifted late: #2 filled 11/15 → #3 projects to 12/15, still before the 12/28 expiry.
p = plan({ ...entry, lastFill: '2026-11-15', rx: 2 }, '2026-11-15');
assert.deepEqual(p.late, []);
// #2 filled 12/5 → #3 projects to 1/4/27, past expiry.
p = plan({ ...entry, lastFill: '2026-12-05', rx: 2 }, '2026-12-05');
assert.deepEqual(p.late, [3]);

// Expired with Rx left unfilled.
p = plan({ ...entry, lastFill: '2026-10-29', rx: 2 }, '2026-12-29');
assert.equal(p.expired, true);

// New check-in 12/22, new Rx #1 not filled yet (rx 0); last fill was the old #3 on 11/28.
const gap = { checkIn: '2026-12-22', lastFill: '2026-11-28', rx: 0 };
assert.equal(validate(gap, '2026-12-23'), null);
p = plan(gap, '2026-12-23');
assert.equal(p.next.n, 1);
assert.equal(iso(p.next.due), '2026-12-28');
assert.equal(iso(p.next.call), '2026-12-27');
assert.equal(p.daysLeft, 5);
assert.equal(iso(p.fills[2]), '2027-02-26');
assert.equal(iso(p.expires), '2027-03-22');
assert.deepEqual(p.late, []);
assert.equal(p.expired, false);
assert.match(validate({ ...gap, lastFill: '2026-12-23' }, '2026-12-23'), /Rx #1/);

// Validation.
assert.match(validate({ ...entry, lastFill: '2026-09-28' }, '2026-10-01'), /before the check-in/);
assert.match(validate({ ...entry, lastFill: '2026-10-02' }, '2026-10-01'), /future/);
assert.match(validate({ ...entry, checkIn: '' }, '2026-10-01'), /check-in/);
assert.match(validate({ ...entry, rx: 4 }, '2026-10-01'), /Rx/);
assert.match(validate({ ...entry, lastFill: '2027-01-01', rx: 3 }, '2027-01-02'), /expired/);

// Day math survives the Nov 1 DST change, and local "today" isn't UTC "today".
assert.equal(toDay('2026-11-02') - toDay('2026-10-31'), 2);
assert.equal(localToday(new Date(2026, 9, 1, 23, 30)), '2026-10-01');

console.log('logic ok');
