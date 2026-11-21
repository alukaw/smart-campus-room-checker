# Project memory

## Product intent & audience

- Smart Campus Room Availability Checker — fictional, client-side demo (Vite + React + TS).
- Shows whether campus rooms are available at a given fictional "now" (09:00 in App.tsx).
- No real users, no real bookings; audience is developers/evaluators reviewing the demo.

## Brand personality & voice

- Inferred: utility-first, clear status communication (available/unavailable), no marketing tone.

## Visual design & UX direction

- Stack constraints from `.bolt/prompt` apply (Tailwind, Lucide React, `@/` alias, JSX). Not restated here.
- App likely uses status indicators, filters, and a room list/grid layout (inferred from `filters.ts` and `data.ts` existence).
- Fictional "now" time displayed at 09:00.

## Decisions, constraints & rationale

- **Six rooms** in `src/data.ts`; tests assert exactly six (D1). Any change to room count breaks tests.
- **AC1–AC5** documented in `src/availability.ts` comments. **AC6** referenced by user but not found anywhere in code/docs — definition pending.
- `checkAvailability` (`src/availability.ts`) and `filterRooms` (`src/filters.ts`, filters F1–F3) are single sources of truth for logic.
- No backend, no database, no login, no API calls, no secrets — consistent with current code but undocumented.
- Test baselines: `npx vitest run` (39/39 pass), `npx tsc --noEmit` (0 errors), `npm run build` (succeeds).
- No `AGENTS.md`, README, or project-level docs exist yet.
- Draft AGENTS.md patch prepared (not applied) capturing user constraints; awaiting approval and AC6 definition.

## Open questions & assumptions

- **AC6 is undefined.** User references it but it's not in code or comments. Need wording before finalizing AGENTS.md.
- **"One fictional room" vs six rooms.** User constraint says one room, but code and tests require six. Which is authoritative — constraint or existing implementation?
- Assumption: Supabase environment prompt should be ignored/overridden by "no database" constraint once AGENTS.md is applied.