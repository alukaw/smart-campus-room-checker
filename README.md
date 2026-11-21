# Smart Campus Room Availability Checker

A fictional, client-side demo built with React, TypeScript, and Vite. It shows whether campus rooms are available at a fixed fictional "now" (09:00). There are no real users and no real bookings — the audience is developers and evaluators reviewing the demo.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

## Verification commands

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Note on type-checking

A bare `npx tsc --noEmit` checks nothing in this project: the root `tsconfig.json` is solution-style (`"files": []` with project references only). Use `npm run typecheck`, which targets the app sources directly.
