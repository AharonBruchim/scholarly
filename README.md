# Scholarly

Scholarly is a web platform for private teachers and students. It combines user profiles, lesson scheduling, student discovery, payment requests, lesson messages, and delivery workflows in one npm-workspaces monorepo.

## Repository structure

| Workspace | Purpose | Default port |
| --- | --- | --- |
| `apps/web-client` | React and Vite browser client | `5173` |
| `services/gateway` | Public API gateway and reverse proxy | `3000` |
| `services/users` | Authentication, sessions, and user profiles | `5000` |
| `services/lessons` | Lesson availability, booking, and scheduling | `6000` |
| `services/billing` | Payment requests, messages, PDFs, and delivery automation | `8000` |
| `packages/shared` | Shared schemas, domain types, and constants | — |
| `packages/utils` | Shared Express, authentication, validation, and logging utilities | — |

All browser API traffic uses the gateway under `/api`. Each service also exposes `/health`, `/isAlive`, and `/isalive` health endpoints.

## Requirements

- A current Node.js LTS release and npm
- MongoDB for the users, lessons, and billing services
- A Chromium executable when billing PDF generation is used
- Google OAuth credentials when Gmail delivery is enabled

## Local development

1. Install all workspace dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file for the web client and each service from its `.env.example` file.

3. For local development, point the gateway service URLs at:

   - `http://localhost:5000` for users
   - `http://localhost:6000` for lessons
   - `http://localhost:8000` for billing

4. Start the full application:

   ```bash
   npm run dev
   ```

The client is available at `http://localhost:5173`, and Vite proxies `/api` requests to the gateway at `http://localhost:3000`.

To start only the backend services, run `npm run dev:services`. Individual workspaces can be started with `npm run dev -w <workspace>`.

## Commands

```bash
npm run dev          # Start the client and all services in watch mode
npm run dev:services # Start all backend services in watch mode
npm run build        # Build every workspace that defines a build script
npm run typecheck    # Type-check every workspace that defines a typecheck script
npm run lint         # Run Biome lint checks
npm run format:check # Check formatting without changing files
npm run check        # Run all Biome checks
```

Use `npm run lint:fix`, `npm run format`, or `npm run check:fix` to apply the corresponding safe automatic fixes.

## Authentication and data access

The users service issues a short-lived access token and a refresh token stored in an `HttpOnly`, `SameSite=Lax` cookie. The browser keeps the access token in memory. Protected requests pass through the gateway, which forwards them to the appropriate service.

The web client uses TanStack Query for server state, including profile, user-directory, lesson, and billing data. Query caches are cleared when a user signs out.

## Documentation

- [Web client](apps/web-client/README.md)
- [Gateway service](services/gateway/README.md)
- [Users service](services/users/README.md)
- [Lessons service](services/lessons/README.md)
- [Billing service](services/billing/README.md)

