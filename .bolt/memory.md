# Project memory

## Product intent & audience

- Smart Campus Room Availability Checker — fictional, client-side demo (Vite + React + TS).
- Shows whether campus rooms are available at a fixed fictional "now" (540 min / 09:00).
- No real users, no real bookings; audience is developers/evaluators reviewing the demo.

## Brand personality & voice

- Utility-first, clear status communication (available/unavailable), no marketing tone.

## Visual design & UX direction

- Stack constraints from `.bolt/prompt` apply (Tailwind, Lucide React, `@/` alias, JSX). Not restated here.
- Status indicators, filters, and room list/grid layout.
- AC6 requires clear availability feedback at all viewport sizes (desktop and mobile).
- Fixed "now" time displayed at 09:00.

## Decisions, constraints & rationale

- **AGENTS.md created** at project root with seven sections: Project, Scope rules, Acceptance criteria, Engineering rules, Commands, Forbidden actions, Review gate.
- **Six rooms** in `src/data.ts` is authoritative; tests depend on all six. Do not reduce to one room.
- **AC1**: reject start >= end and past requests (start <= current time).
- **AC2**: reject durations > 120 minutes.
- **AC3**: reject a blocked room.
- **AC4**: reject overlaps; allow bookings that only touch at endpoints.
- **AC5**: do not mutate booking data (read-only).
- **AC6**: keep clear availability feedback on desktop and mobile.
- `checkAvailability` (`src/availability.ts`) and `filterRooms` (`src/filters.ts`) are single sources of truth.
- No backend, no database (including Supabase), no login, no APIs, no secrets, no external deployments.
- Engineering: prefer pure functions, minimal changes, at most 2 justified patterns.
- Forbidden: editing `src/data.ts` fixtures, deleting/weakening tests, new deps without approval, unrelated refactoring.
- Review gate: run tests before proposing acceptance; report changed files, rationale, real test output; human approves.
- Test baseline: `npm test` passes 41/41.
- Commands: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

## Open questions & assumptions

- No outstanding questions. AC5 and AC6 are defined in AGENTS.md; six-room scope is confirmed authoritative.
- Supabase environment suggestion is explicitly overridden by the "no database" constraint in AGENTS.md.