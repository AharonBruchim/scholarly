# Billing service

The billing service creates payment requests and lesson messages, renders PDF documents, schedules reminders, and manages Gmail, WhatsApp, and SMS delivery workflows. Its records are stored in MongoDB.

Authenticated routes are scoped to the current user. Public document and delivery links use signed, expiring tokens.

## API groups

- `/api/billing` — list, create, cancel, and download payment requests
- `/api/billing/lesson-messages` — list, create, cancel, and download lesson messages
- `/api/billing/preview` — preview automatically generated billing data
- `/api/billing/google` — inspect, authorize, or disconnect a Gmail connection
- `/api/billing/whatsapp` — list and process manual WhatsApp tasks
- `/api/billing/sms` — open and confirm manual SMS delivery
- `/api/billing/public` — signed public documents and delivery links

Health checks are available at `/health`, `/isAlive`, and `/isalive`.

## Development

From the repository root:

```bash
npm install
npm run dev -w services/billing
```

The service listens on port `8000` by default.

```bash
npm run build -w services/billing
npm run typecheck -w services/billing
npm run start -w services/billing
```

## Environment

Create `services/billing/.env` from `.env.example`.

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | HTTP port | `8000` |
| `NODE_ENV` | Runtime environment | — |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost/amanPolls` |
| `JWT_SECRET` | Secret used to verify access tokens | Required |
| `TOKEN_ENCRYPTION_KEY` | Encryption material for stored provider tokens; falls back to `JWT_SECRET` | — |
| `DOCUMENT_LINK_SECRET` | Signing secret for public document links; falls back to `JWT_SECRET` | — |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth client identifier | Required for Gmail delivery |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth client secret | Required for Gmail delivery |
| `GOOGLE_OAUTH_REDIRECT_URI` | Google OAuth callback URL | Required for Gmail delivery |
| `PAYMENT_PDF_BACKGROUND_PATH` | Optional custom PDF background image | Built-in asset |
| `PUBLIC_API_URL` | Public gateway origin used in generated links | `http://localhost:3000` |
| `WEB_APP_URL` | Required public web-client origin | — |
| `AUTOMATION_SCHEDULER_ENABLED` | Enables background automation when not `false` | Enabled |
| `CORS_ORIGIN` | Required comma-separated allowed origins | — |
| `CHROMIUM_PATH` | Chromium executable used by Playwright | `/usr/bin/google-chrome` |

Email can be sent automatically through a connected Gmail account. WhatsApp and SMS are manual handoff flows: the service prepares a link or message and records confirmation after the user completes delivery.
