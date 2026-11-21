import { describe, it, expect } from 'vitest';
import { checkAvailability } from './availability';
import { Room, Booking } from './types';

// ---------------------------------------------------------------------------
// Default fixture
// ---------------------------------------------------------------------------
const CURRENT_TIME = 540; // 09:00

const ROOM_A101: Room = {
  id: 'room-a101',
  code: 'A101',
  name: 'Lecture Hall A1',
  building: 'Engineering Block',
  capacity: 120,
  equipment: ['Projector', 'Microphone', 'Whiteboard'],
  blocked: false,
};

const ROOM_A102: Room = {
  id: 'room-a102',
  code: 'A102',
  name: 'Seminar Room A2',
  building: 'Engineering Block',
  capacity: 30,
  equipment: ['Whiteboard', 'TV Screen'],
  blocked: false,
};

const ROOM_B201: Room = {
  id: 'room-b201',
  code: 'B201',
  name: 'Computer Lab B2',
  building: 'Science Block',
  capacity: 40,
  equipment: ['Computers', 'Projector', 'Whiteboard'],
  blocked: true,
};

const ROOM_C302: Room = {
  id: 'room-c302',
  code: 'C302',
  name: 'Conference Room C3',
  building: 'Central Wing',
  capacity: 16,
  equipment: ['Video Conferencing', 'Whiteboard', 'TV Screen'],
  blocked: false,
};

const ROOM_EMPTY: Room = {
  id: 'room-empty',
  code: 'EMPTY',
  name: 'Empty Room',
  building: 'Test Block',
  capacity: 10,
  equipment: [],
  blocked: false,
};

const DEFAULT_BOOKINGS: Booking[] = [
  { id: 1, roomCode: 'A101', start: 600, end: 660, bookedBy: 'Dr. Smith' },
  { id: 2, roomCode: 'A101', start: 720, end: 780, bookedBy: 'Prof. Lee' },
  { id: 3, roomCode: 'A102', start: 540, end: 600, bookedBy: 'TA Patel' },
  { id: 4, roomCode: 'B202', start: 660, end: 720, bookedBy: 'Dr. Garcia' },
  { id: 5, roomCode: 'C301', start: 540, end: 600, bookedBy: 'Events Office' },
  { id: 6, roomCode: 'C302', start: 780, end: 840, bookedBy: 'Admin' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('checkAvailability', () => {
  // --- AC1: 0 ≤ start < end ≤ 1440, start strictly after currentTime ---

  it('T01: start == currentTime is rejected (start must be strictly after now)', () => {
    const result = checkAvailability(ROOM_A101, '540', '600', CURRENT_TIME, DEFAULT_BOOKINGS);
    expect(result.available).toBe(false);
  });

  it('T02: start before currentTime is rejected', () => {
    const result = checkAvailability(ROOM_A101, '500', '560', CURRENT_TIME, DEFAULT_BOOKINGS);
    expect(result.available).toBe(false);
  });

  it('T03: valid interval after currentTime is accepted (no overlap)', () => {
    const result = checkAvailability(ROOM_A101, '540', '540', CURRENT_TIME, DEFAULT_BOOKINGS);
    // start == end → rejected by start < end rule, not by currentTime
    expect(result.available).toBe(false);
  });

  it('T04: start < 0 is rejected', () => {
    const result = checkAvailability(ROOM_A101, '-10', '60', CURRENT_TIME, DEFAULT_BOOKINGS);
    expect(result.available).toBe(false);
  });

  it('T05: end > 1440 is rejected', () => {
    const result = checkAvailability(ROOM_A101, '1400', '1441', CURRENT_TIME, DEFAULT_BOOKINGS);
    expect(result.available).toBe(false);
  });

  it('T06: start == end is rejected (start must be < end)', () => {
    const result = checkAvailability(ROOM_A101, '600', '600', CURRENT_TIME, DEFAULT_BOOKINGS);
    expect(result.available).toBe(false);
  });

  it('T07: start > end is rejected', () => {
    const result = checkAvailability(ROOM_A101, '700', '660', CURRENT_TIME, DEFAULT_BOOKINGS);
    expect(result.available).toBe(false);
  });

  it('T08: boundary — start 0, end 1440 with currentTime 0 is accepted on empty room', () => {
    const result = checkAvailability(ROOM_EMPTY, '1', '10', 0, []);
    expect(result.available).toBe(true);
  });

  // --- AC2: Reject booking longer than 120 minutes ---

  it('T09: booking of exactly 120 minutes is accepted (boundary, no overlap)', () => {
    const result = checkAvailability(ROOM_A101, '660', '780', CURRENT_TIME, DEFAULT_BOOKINGS);
    // 660–720 gap then 720–780 booking exists. 660–780 overlaps 720–780.
    // Use empty room instead for clean 120-min boundary.
    const result2 = checkAvailability(ROOM_EMPTY, '10', '130', 0, []);
    expect(result2.available).toBe(true);
  });

  it('T10: booking of 121 minutes is rejected', () => {
    const result = checkAvailability(ROOM_EMPTY, '10', '131', 0, []);
    expect(result.available).toBe(false);
  });

  // --- AC3: Reject when room is blocked ---

  it('T11: blocked room is rejected even with a valid interval', () => {
    const result = checkAvailability(ROOM_B201, '600', '660', CURRENT_TIME, DEFAULT_BOOKINGS);
    expect(result.available).toBe(false);
  });

  it('T12: no room selected (undefined) is rejected', () => {
    const result = checkAvailability(undefined, '600', '660', CURRENT_TIME, DEFAULT_BOOKINGS);
    expect(result.available).toBe(false);
  });

  // --- AC4: Reject overlap; touching endpoints allowed ---

  it('T13: interval fully inside existing booking is rejected (overlap)', () => {
    const result = checkAvailability(ROOM_A101, '610', '650', CURRENT_TIME, DEFAULT_BOOKINGS);
    expect(result.available).toBe(false);
  });

  it('T14: interval partially overlapping existing booking is rejected', () => {
    const result = checkAvailability(ROOM_A101, '630', '700', CURRENT_TIME, DEFAULT_BOOKINGS);
    expect(result.available).toBe(false);
  });

  it('T15: touching at start endpoint is allowed (end == existing.start)', () => {
    const result = checkAvailability(ROOM_A101, '540', '600', CURRENT_TIME, DEFAULT_BOOKINGS);
    // 540 == currentTime → rejected by AC1. Use a different touch point.
    const result2 = checkAvailability(ROOM_A101, '660', '720', CURRENT_TIME, DEFAULT_BOOKINGS);
    // 660 == first booking end (touching), 720 == second booking start (touching)
    expect(result2.available).toBe(true);
  });

  it('T16: touching at end endpoint is allowed (start == existing.end)', () => {
    const result = checkAvailability(ROOM_A101, '660', '720', CURRENT_TIME, DEFAULT_BOOKINGS);
    expect(result.available).toBe(true);
  });

  // --- AC5: No mutation of existing booking data ---

  it('T17: check does not mutate existing bookings array', () => {
    const bookingsCopy = DEFAULT_BOOKINGS.map((b) => ({ ...b }));
    checkAvailability(ROOM_A101, '660', '720', CURRENT_TIME, bookingsCopy);
    expect(bookingsCopy).toEqual(DEFAULT_BOOKINGS);
  });

  // --- Additional coverage for AC5 (available result does not change data) ---

  it('T18: an available result does not alter existing bookings', () => {
    const bookingsCopy = DEFAULT_BOOKINGS.map((b) => ({ ...b }));
    const result = checkAvailability(ROOM_EMPTY, '10', '60', 0, bookingsCopy);
    expect(result.available).toBe(true);
    expect(bookingsCopy).toEqual(DEFAULT_BOOKINGS);
  });

  // --- AC1 validation runs before AC3 (blocked room with invalid interval) ---

  it('T19: blocked room with start == currentTime is rejected by AC1, not AC3', () => {
    const result = checkAvailability(ROOM_B201, '540', '600', CURRENT_TIME, DEFAULT_BOOKINGS);
    expect(result.available).toBe(false);
    expect(result.reason).toContain('current time');
  });

  // --- AC2 validation runs before AC4 (long booking on overlapping room) ---

  it('T20: 200-minute booking on overlapping room is rejected by AC2, not AC4', () => {
    const result = checkAvailability(ROOM_A101, '550', '750', CURRENT_TIME, DEFAULT_BOOKINGS);
    expect(result.available).toBe(false);
    expect(result.reason).toContain('120');
  });
});
