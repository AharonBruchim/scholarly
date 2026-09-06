# Scholarly web client

The browser application for Scholarly, built with React 19, TypeScript, Vite, React Router, Tailwind CSS, TanStack Query, and form validation with Zod.

## Development

From the repository root:

```bash
npm install
npm run dev -w apps/web-client
```

The Vite development server runs on `http://localhost:5173` and proxies `/api` to the gateway on `http://localhost:3000`.

Available workspace commands:

```bash
npm run dev -w apps/web-client
npm run build -w apps/web-client
npm run lint -w apps/web-client
npm run preview -w apps/web-client
```

## Environment

`VITE_AUTH_API_URL` sets the API base URL. When it is empty or omitted, the client uses `/api`, which is the recommended value when the client and gateway share an origin or when the Vite development proxy is active.

## Routes

| Route | Access |
| --- | --- |
| `/login` | Public |
| `/register` | Public |
| `/teacher` | Authenticated teachers |
| `/student` | Authenticated students |
| `/profile` | Authenticated teachers and students |

Unknown routes redirect to `/login`.

## Server state

TanStack Query owns remote server state and caching. It is used for user profiles, the teacher and student directory, lessons, billing data, and related mutations. The profile page reads and updates the shared profile query rather than maintaining a separate request lifecycle with `useEffect` and `useState`.

The default query configuration keeps data fresh for 60 seconds, retries failed queries once, and does not refetch automatically on window focus or network reconnect. Signing out clears the query cache.

## Authentication

- Access tokens are stored in application memory only.
- Refresh tokens are sent in an `HttpOnly`, `SameSite=Lax` cookie.
- A legacy `localStorage["scholarly.auth.session"]` value is removed on startup.
- Role-protected routes prevent students and teachers from opening each other's dashboards.
- A user can read and update only their own full profile.

## Localization

The client uses `i18next` and `react-i18next`. Hebrew is the default interface language, and English is available from the language control in the header.

- Translation resources are in `src/i18n/index.ts`.
- The selected language is stored in `localStorage["scholarly.language"]`.
- Hebrew sets the document to `lang="he"` and `dir="rtl"`.
- English sets the document to `lang="en"` and `dir="ltr"`.
- Dates and times use `Intl.DateTimeFormat` with the matching locale.

Add user-facing text to both translation resources instead of writing it directly in JSX.

## Current product behavior

- Students can search the privacy-limited teacher directory and view or manage their lessons.
- Teachers can search registered students, create individual or recurring lessons, publish available slots, and manage scheduled lessons.
- Both roles can update their profile and messaging preferences.
- Billing screens support payment requests, lesson messages, PDF previews, Gmail connection, and manual WhatsApp or SMS delivery tasks.
