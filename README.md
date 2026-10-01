# Phil

Refill countdown + check-in tracker for a 3-scripts-per-visit, 30-day controlled Rx. Static PWA, no backend: data lives in the phone's localStorage.

- `logic.js`: all date math, pure. Tunable constants at the top (`BOOK_LEAD` is a guess; set it to your clinic's real booking lead time).
- `index.html`: the whole UI. Visual language is Cartus's (`../cartus/docs/DESIGN.md`).
- `sw.js`: network-first offline cache. Bump `CACHE` if you ever change the file list.

Test: `node logic.test.mjs`
Run: `python3 -m http.server 8765`, then open http://localhost:8765

## Reminders
A web app can't write to Apple Reminders directly. "Remind me" opens a `Phil Reminder` Shortcut with text like
`Book doctor check-in — December 7, 2026 at 9:00 AM`; the shortcut's "Get Dates from Input" → "Add New Reminder" files it. The app walks you through setting it up on first tap.
