# Lessons service

The lessons service owns lesson availability and scheduling. It supports individual lessons, recurring series, available slots, booking, cancellation, rescheduling, and updates while enforcing role and schedule rules.

All lesson API routes require a valid access token.

## API

- `POST /api/lessons` — create a lesson or available slot
- `POST /api/lessons/series` — create a recurring lesson series
- `GET /api/lessons` — list lessons visible to the authenticated user
- `GET /api/lessons/:id` — read one accessible lesson
- `POST /api/lessons/:id/book` — book an available slot
- `POST /api/lessons/:id/cancel` — cancel a lesson
- `POST /api/lessons/:id/reschedule` — reschedule a lesson
- `PATCH /api/lessons/:id` — update a lesson

Health checks are available at `/health`, `/isAlive`, and `/isalive`.

## Development

From the repository root:

```bash
npm install
npm run dev -w services/lessons
```

The service listens on port `6000` by default.

```bash
npm run build -w services/lessons
npm run typecheck -w services/lessons
npm run start -w services/lessons
```

## Environment

Create `services/lessons/.env` from `.env.example`.

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | HTTP port | `6000` |
| `NODE_ENV` | Runtime environment | — |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost/amanPolls` |
| `JWT_SECRET` | Secret used to verify access tokens | Required |
| `CORS_ORIGIN` | Required comma-separated allowed origins | — |

The lessons and users services must use the same `JWT_SECRET` so that lesson routes can authenticate tokens issued by the users service.

