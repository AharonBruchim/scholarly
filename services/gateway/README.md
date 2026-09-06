# Gateway service

The gateway is the public backend entry point for Scholarly. It applies common HTTP security and CORS settings, then proxies API requests to the users, lessons, and billing services.

## Routes

| Public prefix | Target service |
| --- | --- |
| `/api/auth` | Users |
| `/api/users` | Users |
| `/api/lessons` | Lessons |
| `/api/billing` | Billing |

Health checks are available at `/health`, `/isAlive`, and `/isalive`. Unknown routes return `404`.

## Development

From the repository root:

```bash
npm install
npm run dev -w services/gateway
```

The service listens on port `3000` by default.

```bash
npm run build -w services/gateway
npm run typecheck -w services/gateway
npm run start -w services/gateway
```

## Environment

Create `services/gateway/.env` from `.env.example`.

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | HTTP port | `3000` |
| `NODE_ENV` | Runtime environment | — |
| `REQUEST_TIMEOUT` | Upstream timeout in milliseconds | `10000` |
| `USERS_SERVICE_URI` | Users service origin | `http://users:5000` |
| `USERS_BASE_ROUTE` | Public users prefix | `/api/users` |
| `AUTH_BASE_ROUTE` | Public authentication prefix | `/api/auth` |
| `LESSONS_SERVICE_URI` | Lessons service origin | `http://lessons:6000` |
| `LESSONS_BASE_ROUTE` | Public lessons prefix | `/api/lessons` |
| `BILLING_SERVICE_URI` | Billing service origin | `http://billing:8000` |
| `BILLING_BASE_ROUTE` | Public billing prefix | `/api/billing` |
| `CORS_ORIGIN` | Required comma-separated allowed origins | — |

The default service hostnames are intended for a container network. Replace them with `localhost` URLs when running every service directly on the host.

