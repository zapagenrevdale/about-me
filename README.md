# about-me
Minimal personal site.

## Database

This project uses Drizzle ORM with SQLite/libSQL through Turso's TypeScript
client.

Copy the environment template:

```sh
cp .env.example .env
```

For the simplest local setup, keep `TURSO_DATABASE_URL=file:local.db`. For
Turso's local libSQL server, install the Turso CLI, run this in another shell,
and set `TURSO_DATABASE_URL=http://127.0.0.1:8080`:

```sh
pnpm db:dev
```

Database commands:

```sh
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:studio
```

## Diary auth

The diary is protected by a single-owner password flow. Generate a password hash
locally and store only the hash in `.env`:

```sh
pnpm diary:hash
```

Required environment variables:

```env
DIARY_PASSWORD_HASH=scrypt:v1:...
DIARY_SESSION_SECRET=replace-with-at-least-32-random-characters
```

Diary sessions use a 10-minute idle timeout. Valid session cookies are refreshed
on each `/diary` request by `src/proxy.ts`.

## PostHog

PostHog is initialized from `src/instrumentation-client.ts` using the
official Next.js `instrumentation-client.ts` pattern. Server-side errors are
captured from `src/instrumentation.ts` using `posthog-node`.

Required environment variables:

```env
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=your_project_token
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```
