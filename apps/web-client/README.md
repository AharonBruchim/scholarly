# Scholarly web client

React/Vite client for Scholarly.

## Development

From the repository root:

```bash
npm install
npm run dev
```

The Vite development server proxies `/api` to the gateway on `http://localhost:3000`. The root `npm run dev` command starts the gateway with local service URLs for users (`5000`), lessons (`6000`), and billing (`8000`).

## Localization

The client uses `i18next` and `react-i18next`. Hebrew is the default language and English is available from the language control in the header.

- Translation resources: `src/i18n/index.ts`
- Saved preference: `localStorage["scholarly.language"]`
- Hebrew sets `<html lang="he" dir="rtl">`
- English sets `<html lang="en" dir="ltr">`
- Dates and times are formatted with `Intl.DateTimeFormat` for `he-IL` or `en-US`

User-facing text on active routes must be added to both translation resources instead of being written directly in JSX.

## Dashboard data

Both dashboards read real lesson records from `GET /api/lessons`:

- Students send `studentId=<authenticated user id>`.
- Teachers send `teacherId=<authenticated user id>`.
- Upcoming lessons are non-cancelled, scheduled lessons whose start time is in the future.
- Subject and student counts are calculated from returned lesson records.

The product does not have grades, so the dashboard deliberately contains no grade or average metric.
