# Users service

The users service owns registration, login, refresh sessions, logout, role-aware directory access, and self-service profile management. User and refresh-session data is stored in MongoDB.

## API

The service mounts its routes under `/api`.

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Users

- `POST /api/users`
- `GET /api/users` — authenticated, privacy-limited directory access
- `GET /api/users/:id` — authenticated owner only
- `PATCH /api/users/:id` — authenticated owner only
- `DELETE /api/users/:id` — authenticated owner only

Health checks are available at `/health`, `/isAlive`, and `/isalive`.

## Development

From the repository root:

```bash
npm install
npm run dev -w services/users
```

The service listens on port `5000` by default.

```bash
npm run build -w services/users
npm run typecheck -w services/users
npm run start -w services/users
```

## Environment

Create `services/users/.env` from `.env.example`.

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | HTTP port | `5000` |
| `NODE_ENV` | Runtime environment | — |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost/amanPolls` |
| `BCRYPT_ROUNDS` | Required password-hashing cost, from `10` through `15` | — |
| `JWT_SECRET` | Secret used to sign and verify tokens | Required |
| `CORS_ORIGIN` | Required comma-separated allowed origins | — |

The access token is returned to the client and kept in memory. Refresh tokens are rotated and sent through an `HttpOnly`, `SameSite=Lax` cookie.
