import { Booking, Room } from './types';
import { checkAvailability, ReasonCode } from './availability';
import { ROOMS } from './data';

/**
 * Practice 12 contract for room A101 at a fixed 09:00 demo "now".
 * Validation layer: validateContractInput / parseStartTime.
 * Calculation layer: checkContract, which delegates the availability
 * decision to checkAvailability (single source of truth) on a copy of
 * the A101 room with `blocked` taken from the input. Inputs are never
 * mutated (AC5).
 */

export type ContractReasonCode =
  | 'INVALID_START'
  | 'INVALID_DURATION'
  | 'ENDS_AFTER_DAY'
  | 'PAST_START'
  | 'BLOCKED'
  | 'OVERLAP'
  | 'AVAILABLE';

export interface ContractResult {
  available: boolean;
  reasonCode: ContractReasonCode;
  message: string;
}

export const A101_CODE = 'A101';
export const A101_CURRENT_TIME = 540; // 09:00
export const A101_DAY_END = 1440; // 24:00

const A101_MESSAGES: Record<ContractReasonCode, string> = {
  INVALID_START: 'Invalid input: enter the start time as HH:MM.',
  INVALID_DURATION:
    'Invalid input: duration must be a whole number from 1 to 120 minutes.',
  ENDS_AFTER_DAY: 'Invalid input: the booking must end by 24:00.',
  PAST_START:
    'Invalid input: start time must be after the current time (09:00).',
  BLOCKED: 'Unavailable: A101 is blocked for maintenance.',
  OVERLAP: 'Unavailable: overlaps the existing booking HH:MM-HH:MM.',
  AVAILABLE: 'Available: A101 is free from HH:MM to HH:MM.',
};

export function parseStartTime(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export type ContractInputError =
  | { code: 'INVALID_START' }
  | { code: 'INVALID_DURATION' }
  | { code: 'ENDS_AFTER_DAY' }
  | { code: 'PAST_START'; start: number };

export type ContractInput =
  | { ok: true; start: number; duration: number; error?: undefined }
  | { ok: false; error: ContractInputError };

export function validateContractInput(
  startStr: string,
  durationStr: string
): ContractInput {
  const start = parseStartTime(startStr);
  if (start === null) {
    return { ok: false, error: { code: 'INVALID_START' } };
  }
  const durationStrTrimmed = durationStr.trim();
  const duration = Number(durationStrTrimmed);
  if (
    durationStrTrimmed === '' ||
    Number.isNaN(duration) ||
    !Number.isInteger(duration) ||
    duration <= 0 ||
    duration > 120
  ) {
    return { ok: false, error: { code: 'INVALID_DURATION' } };
  }
  if (start + duration > A101_DAY_END) {
    return { ok: false, error: { code: 'ENDS_AFTER_DAY' } };
  }
  if (start <= A101_CURRENT_TIME) {
    return { ok: false, error: { code: 'PAST_START', start } };
  }
  return { ok: true, start, duration };
}

/**
 * Calculation layer. Delegates to checkAvailability() on a copied room so
 * the shared booking rules stay the single source of truth; maps its
 * reason codes to the contract codes and messages.
 */
export function checkContract(
  startTimeStr: string,
  durationMinutes: string,
  blocked: boolean,
  bookings: Booking[]
): ContractResult {
  const parsed = validateContractInput(startTimeStr, durationMinutes);
  if (!parsed.ok) {
    const { error } = parsed;
    if (error.code === 'PAST_START') {
      return {
        available: false,
        reasonCode: 'PAST_START',
        message: A101_MESSAGES.PAST_START,
      };
    }
    return {
      available: false,
      reasonCode: error.code,
      message: A101_MESSAGES[error.code],
    };
  }

  const sourceRoom = ROOMS.find((r) => r.code === A101_CODE);
  if (!sourceRoom) {
    throw new Error('A101 is missing from ROOMS');
  }
  const room: Room = { ...sourceRoom, blocked };

  const end = parsed.start + parsed.duration;
  const result = checkAvailability(
    room,
    String(parsed.start),
    String(end),
    A101_CURRENT_TIME,
    bookings
  );

  return {
    available: result.available,
    reasonCode: mapReasonCode(result.reasonCode),
    message: buildMessage(result.reasonCode, parsed.start, end, bookings),
  };
}

function mapReasonCode(core: ReasonCode): ContractReasonCode {
  switch (core) {
    case 'AVAILABLE':
      return 'AVAILABLE';
    case 'BLOCKED':
      return 'BLOCKED';
    case 'OVERLAP':
      return 'OVERLAP';
    case 'PAST_TIME':
      return 'PAST_START';
    case 'TOO_LONG':
      return 'INVALID_DURATION';
    case 'START_NOT_BEFORE_END':
    case 'OUT_OF_RANGE':
    case 'INVALID_INPUT':
    case 'NO_ROOM':
    default:
      return 'INVALID_START';
  }
}

function buildMessage(
  core: ReasonCode,
  start: number,
  end: number,
  bookings: Booking[]
): string {
  switch (core) {
    case 'AVAILABLE':
      return `Available: ${A101_CODE} is free from ${formatHHMM(start)} to ${formatHHMM(end)}.`;
    case 'OVERLAP': {
      const overlap = bookings.find(
        (b) => b.roomCode === A101_CODE && start < b.end && end > b.start
      );
      const range = overlap
        ? `${formatHHMM(overlap.start)}-${formatHHMM(overlap.end)}`
        : 'unknown';
      return `Unavailable: overlaps the existing booking ${range}.`;
    }
    case 'BLOCKED':
      return A101_MESSAGES.BLOCKED;
    case 'PAST_TIME':
      return A101_MESSAGES.PAST_START;
    case 'TOO_LONG':
      return A101_MESSAGES.INVALID_DURATION;
    default:
      return A101_MESSAGES.INVALID_START;
  }
}

export function formatHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
