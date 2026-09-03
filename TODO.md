# Scholarly TODO

## Completed in the current implementation

- [x] Hebrew/RTL is the default UI; English remains available as a language switch.
- [x] Dashboard data comes from authenticated lesson APIs rather than fake counters.
- [x] Access and refresh tokens no longer live in `localStorage`; refresh tokens are rotating HttpOnly cookies.
- [x] Lesson endpoints require JWT authentication and scope reads/writes to the authenticated teacher or student.
- [x] A teacher creates an open or assigned lesson slot, including recurring weekly series.
- [x] Lesson duration and price are snapshotted on every slot and can use teacher/subject defaults or a per-slot override.
- [x] Students book only open slots. Booking uses an atomic status change and rejects schedule collisions.
- [x] Cancellation and rescheduling are automatic. Changes within 24 hours charge the old lesson in full; rescheduling uses another open slot with the same teacher.
- [x] Cancelled student slots are reopened for another student while retaining the original charge record.
- [x] Date selection shows Gregorian and Hebrew dates and Israeli holidays, using `@hebcal/core`.
- [x] Reminder jobs are created for 30 hours and 30 minutes before assigned lessons.
- [x] Monthly payment-request aggregation includes completed/past lessons and fully charged late cancellations.
- [x] Styled Hebrew payment-request PDFs are generated server-side and stored with idempotent teacher/student/month keys.
- [x] Email/WhatsApp/SMS delivery jobs are kept in an idempotent outbox and respect recipient consent.
- [x] Teachers can create immediate or scheduled manual payment requests from selected lessons and custom line items.
- [x] Manually billed lessons are excluded from automatic monthly requests until the manual request is cancelled.
- [x] Payment requests and lesson messages keep an immutable history with scheduled, delivery, failure, and cancellation states.
- [x] Teachers can send or schedule multi-lesson messages grouped into one delivery per student.
- [x] Lesson messages include a styled PDF stored with the message, attached to Gmail, and exposed through signed WhatsApp/SMS links.
- [x] Gmail uses per-teacher Google OAuth, encrypted refresh tokens, offline access, retries, and a queued delivery worker.
- [x] Private WhatsApp accounts use an explicit manual-send flow with a prepared message and signed PDF link.
- [x] The teacher dashboard shows the next automatic request date, period, estimated amount, and unbilled lesson/student counts.
- [x] The insecure manual payment-request upload/email route and its browser-side PDF dependency were removed.
- [x] `npm audit` currently reports zero known vulnerabilities.

## P0 — required before real message delivery

- [ ] Decide whether SMS uses each teacher's own approved sender ID through Twilio or a shared Scholarly sender. SMS remains link-only for PDFs.
- [ ] Move PDFs from MongoDB to private object storage with short-lived signed links before production scale.
- [ ] Create the Google Cloud OAuth app and configure `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, redirect URI, production URLs, `INTERNAL_AUTOMATION_KEY`, and `CHROMIUM_PATH`.

## P0 — verification

- [ ] Add Mongo-backed authorization integration tests for unauthenticated, cross-student, cross-teacher, booking-race, cancellation, and rescheduling flows.
- [ ] Add end-to-end tests using dedicated test accounts for teacher slot creation → student booking → reminders → monthly PDF.
- [ ] Add webhook signature and replay tests for email/WhatsApp/SMS providers once providers are selected.

## P1 — remaining product work

- [ ] Add recurring availability templates that generate slots continuously beyond the initial finite series.
- [ ] Add the payment-request history/download screen to the student dashboard; the teacher dashboard is complete.
- [ ] Add system-wide teacher/student messaging and conversation history; no super-admin role.
- [ ] Replace remaining backend English messages with stable error codes translated by the client.

There is intentionally no grades task: grades are not part of this product.

## External development issue

Chrome DevTools 152 can inject a `web-vitals` script that throws `reportAllChanges: Cannot read properties of undefined (reading 'startTime')` during SPA navigation. The anonymous `VM*` stack has no application frames and is tracked upstream at <https://github.com/GoogleChrome/web-vitals/issues/792>.
