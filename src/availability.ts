import { Booking, Room } from './types';

export type ReasonCode =
  | 'AVAILABLE'
  | 'INVALID_INPUT'
  | 'OUT_OF_RANGE'
  | 'START_NOT_BEFORE_END'
  | 'PAST_TIME'
  | 'TOO_LONG'
  | 'NO_ROOM'
  | 'BLOCKED'
  | 'OVERLAP';

export interface AvailabilityResult {
  available: boolean;
  reason: string;
  reasonCode: ReasonCode;
}

/**
 * Core decision function — implements AC1 through AC4.
 * Never mutates existing bookings (AC5).
 */
export function checkAvailability(
  room: Room | undefined,
  startStr: string,
  endStr: string,
  currentTime: number,
  existingBookings: Booking[]
): AvailabilityResult {
  // Parse inputs: Number() rejects trailing garbage ('600abc'), scientific
  // notation is valid ('6e2' = 600), empty string is invalid, fractions rejected
  const start = Number(startStr);
  const end = Number(endStr);

  if (
    startStr.trim() === '' ||
    endStr.trim() === '' ||
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    !Number.isInteger(start) ||
    !Number.isInteger(end)
  ) {
    return { available: false, reason: 'Please enter valid numeric times.', reasonCode: 'INVALID_INPUT' };
  }

  // AC1: 0 ≤ start < end ≤ 1440, and start must be after currentTime
  if (start < 0 || end > 1440) {
    return { available: false, reason: 'Times must be within 0–1440 minutes (00:00 to 24:00).', reasonCode: 'OUT_OF_RANGE' };
  }
  if (start >= end) {
    return { available: false, reason: 'Start time must be before end time.', reasonCode: 'START_NOT_BEFORE_END' };
  }
  if (start <= currentTime) {
    return {
      available: false,
      reason: `Start time must be after the current time (${formatTime(currentTime)}).`,
      reasonCode: 'PAST_TIME',
    };
  }

  // AC2: Reject bookings longer than 120 minutes
  if (end - start > 120) {
    return { available: false, reason: 'Booking cannot exceed 120 minutes.', reasonCode: 'TOO_LONG' };
  }

  // AC3: Reject when room is blocked
  if (!room) {
    return { available: false, reason: 'Please select a room.', reasonCode: 'NO_ROOM' };
  }
  if (room.blocked) {
    return { available: false, reason: `${room.code} is currently blocked for maintenance.`, reasonCode: 'BLOCKED' };
  }

  // AC4: Reject overlap with existing bookings (touching endpoints allowed)
  const roomBookings = existingBookings.filter((b) => b.roomCode === room.code);
  for (const b of roomBookings) {
    if (start < b.end && end > b.start) {
      return {
        available: false,
        reason: `Overlaps an existing booking by ${b.bookedBy} (${formatTime(b.start)}–${formatTime(b.end)}).`,
        reasonCode: 'OVERLAP',
      };
    }
  }

  return { available: true, reason: `${room.code} is available for ${formatTime(start)}–${formatTime(end)}.`, reasonCode: 'AVAILABLE' };
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
