# AGENTS.md

## Project

Smart Campus Room Availability Checker — a fictional, client-side demo built with React, TypeScript, and Vite. It shows whether campus rooms are available at a fixed fictional "now". There are no real users and no real bookings; the audience is developers/evaluators reviewing the demo.

## Scope rules

- The app has **six fictional rooms**, defined in `src/data.ts`. Do not reduce the app to one room; the test suite depends on six rooms.
- The current time is fixed at **540 minutes (09:00)**.
- No login, no backend, no database (including Supabase), no external APIs, and no saved booking creation.
- No secrets of any kind.
- No external deployments.
- The mock explanation adapter is allowed (no network, no keys).

## Acceptance criteria

- **AC1**: Reject a request where start >= end, and reject requests that start at or before the current time (past requests).
- **AC2**: Reject bookings longer than 120 minutes.
- **AC3**: Reject a room that is blocked (e.g. for maintenance).
- **AC4**: Reject bookings that overlap an existing booking, but allow bookings that only touch at endpoints (one ends exactly when the other begins).
- **AC5**: Do not mutate booking data. Existing bookings are read-only; availability checks never add, change, or remove them.
- **AC6**: Keep clear availability feedback on desktop and mobile. The user must always see why a room is available or unavailable, in a readable layout at every viewport size.

## Engineering rules

- Prefer pure functions and minimal changes.
- Use at most 2 justified patterns; avoid introducing abstractions without at least two concrete call sites.
- `filterRooms` (src/filters.ts) and `checkAvailability` (src/availability.ts) are the **single sources of truth** for their logic. Do not duplicate or bypass them.

## Commands

- `npm test` — run the test suite (Vitest).
- `npm run typecheck` — type-check the app sources.
- `npm run lint` — run ESLint.
- `npm run build` — production build.

## Permissions

- Allowed commands: only the four commands in the Commands section, plus npm install when the human asks for it.
- Edit only the files named in the task. Do not create or delete other files without approval.
- AGENTS.md is not loaded automatically in Bolt, so every task prompt starts with: Read the root AGENTS.md first.

## Forbidden actions

- Introducing real personal data.
- Introducing secrets.
- Using external services or deployments.
- Adding new dependencies without approval.
- Deleting or weakening existing tests.
- Editing the fixtures in `src/data.ts`.
- Unrelated refactoring.
- Running destructive commands (for example rm -rf, deleting folders, clearing version history or force pushing).
- Adding, removing or upgrading dependencies, or editing package.json or package-lock.json, without human approval.
- Publishing or deploying the app. Only the human clicks Publish.

## Review gate

- Run the tests before proposing acceptance.
- Report changed files, rationale, and real test output.
- A human approves before publishing.
