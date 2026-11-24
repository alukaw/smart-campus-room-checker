# Practice 12 – Shared requirement and acceptance-criteria sheet

This one sheet was written before implementation and used unchanged for both solutions:

- **Code-based:** Bolt.new project (React + TypeScript + Vite), tab "Single-room checker" – `src/contract.ts`, `src/components/ContractChecker.tsx`
- **Low-code:** Appsmith Cloud (free plan), app "Smart Campus A101 Low-code" – JS object `AvailabilityRules` + 9 widgets

## User story

As a student, I want to choose a future start time and a duration for the fictional campus room **A101** and immediately see **Available** or **Unavailable** with a clear reason, so that I can plan a study session without changing any existing bookings.

## Fixed context (fictional, same in both)

| Item | Value |
|---|---|
| Room | A101 "Lecture Hall A1" (fictional) |
| Current time ("now") | fixed at 09:00 (540 minutes) |
| Existing bookings (read-only) | B1 10:00–11:00 (Dr. Smith), B2 12:00–13:00 (Prof. Lee) – the existing fixtures from `src/data.ts`, not edited |
| Demo day | one day, 00:00–24:00 |
| Not included | real personal data, login, payment, production database, AI explanation feature |

## Acceptance criteria

| ID | Criterion |
|---|---|
| AC1 | Start time must be in the future (strictly after 09:00). |
| AC2 | Duration must be greater than zero and at most 120 minutes. |
| AC3 | Overlapping bookings are unavailable (touching endpoints, e.g. 11:00–12:00 next to 10:00–11:00, are **not** overlaps). |
| AC4 | A blocked room is unavailable. |
| AC5 | Display a clear decision without changing existing bookings. |
| AC6 | Invalid input receives understandable feedback. |

## Inputs

| Input | Type | Rule |
|---|---|---|
| `startTime` | text `HH:MM` | 00:00–23:59, two-digit hours and minutes |
| `durationMinutes` | text / number | whole number |
| `blocked` | boolean (room-status control) | default `false` |
| `bookings` | list `{id, start, end, bookedBy}` | read-only |

## Outputs

| Output | Type |
|---|---|
| `available` | boolean |
| `reasonCode` | one of the codes below |
| `message` | visible text (exact wording below) |

## Reason codes, evaluation order and exact messages

| # | reasonCode | available | Visible message | Shown as |
|---|---|---|---|---|
| 1 | `INVALID_START` | false | Invalid input: enter the start time as HH:MM. | Invalid input |
| 2 | `INVALID_DURATION` | false | Invalid input: duration must be a whole number from 1 to 120 minutes. | Invalid input |
| 3 | `ENDS_AFTER_DAY` | false | Invalid input: the booking must end by 24:00. | Invalid input |
| 4 | `PAST_START` | false | Invalid input: start time must be after the current time (09:00). | Invalid input |
| 5 | `BLOCKED` | false | Unavailable: A101 is blocked for maintenance. | Unavailable |
| 6 | `OVERLAP` | false | Unavailable: overlaps the existing booking HH:MM-HH:MM. | Unavailable |
| 7 | `AVAILABLE` | true | Available: A101 is free from HH:MM to HH:MM. | Available |

Checks run in this order; the first failing check decides the result.

## Common test inputs (prepared before implementation)

| Test | Start | Duration | Blocked | Expected available | Expected reasonCode | AC |
|---|---|---|---|---|---|---|
| T1 valid free interval | 13:30 | 60 | no | true | AVAILABLE | AC1–AC3 |
| T2 overlap | 10:30 | 60 | no | false | OVERLAP (10:00-11:00) | AC3 |
| T3 blocked room | 13:30 | 60 | yes | false | BLOCKED | AC4 |
| T4 duration = 0 | 13:30 | 0 | no | false | INVALID_DURATION | AC2, AC6 |
| T5 duration = 121 | 13:30 | 121 | no | false | INVALID_DURATION | AC2, AC6 |
| T6 past start | 08:00 | 30 | no | false | PAST_START | AC1, AC6 |
| T7 adjacent interval | 11:00 | 60 | no | true | AVAILABLE (touches both bookings) | AC3 |
| T8 data unchanged | after T1–T7 | – | – | bookings identical to the original | – | AC5 |
