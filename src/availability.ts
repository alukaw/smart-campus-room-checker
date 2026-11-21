import { Booking, Room } from './types';

export interface AvailabilityResult {
  available: boolean;
  reason: string;
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
  // Parse inputs
  const start = parseInt(startStr, 10);
  const end = parseInt(endStr, 10);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return { available: false, reason: 'Please enter valid numeric times.' };
  }

  // AC1: 0 ≤ start < end ≤ 1440, and start must be after currentTime
  if (start < 0 || end > 1440) {
    return { available: false, reason: 'Times must be within 0–1440 minutes (00:00 to 24:00).' };
  }
  if (start >= end) {
    return { available: false, reason: 'Start time must be before end time.' };
  }
  if (start <= currentTime) {
    return {
      available: false,
      reason: `Start time must be after the current time (${formatTime(currentTime)}).`,
    };
  }

  // AC2: Reject bookings longer than 120 minutes
  if (end - start > 120) {
    return { available: false, reason: 'Booking cannot exceed 120 minutes.' };
  }

  // AC3: Reject when room is blocked
  if (!room) {
    return { available: false, reason: 'Please select a room.' };
  }
  if (room.blocked) {
    return { available: false, reason: `${room.code} is currently blocked for maintenance.` };
  }

  // AC4: Reject overlap with existing bookings (touching endpoints allowed)
  const roomBookings = existingBookings.filter((b) => b.roomCode === room.code);
  for (const b of roomBookings) {
    if (start < b.end && end > b.start) {
      return {
        available: false,
        reason: `Overlaps an existing booking by ${b.bookedBy} (${formatTime(b.start)}–${formatTime(b.end)}).`,
      };
    }
  }

  return { available: true, reason: `${room.code} is available for ${formatTime(start)}–${formatTime(end)}.` };
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
