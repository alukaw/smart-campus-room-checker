import { describe, it, expect } from 'vitest';
import { filterRooms } from './filters';
import { Room } from './types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const ROOMS: Room[] = [
  {
    id: 'room-a101',
    code: 'A101',
    name: 'Lecture Hall A1',
    building: 'Engineering Block',
    capacity: 120,
    equipment: ['Projector', 'Microphone', 'Whiteboard'],
    blocked: false,
  },
  {
    id: 'room-a102',
    code: 'A102',
    name: 'Seminar Room A2',
    building: 'Engineering Block',
    capacity: 30,
    equipment: ['Whiteboard', 'TV Screen'],
    blocked: false,
  },
  {
    id: 'room-b201',
    code: 'B201',
    name: 'Computer Lab B2',
    building: 'Science Block',
    capacity: 40,
    equipment: ['Computers', 'Projector', 'Whiteboard'],
    blocked: true,
  },
  {
    id: 'room-c302',
    code: 'C302',
    name: 'Conference Room C3',
    building: 'Central Wing',
    capacity: 16,
    equipment: ['Video Conferencing', 'Whiteboard', 'TV Screen'],
    blocked: false,
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('filterRooms', () => {
  it('F1: exact capacity is accepted (capacity === attendees)', () => {
    const result = filterRooms(ROOMS, 30, []);
    expect(result.map((r) => r.code)).toContain('A102');
  });

  it('F1: insufficient capacity is rejected (capacity < attendees)', () => {
    const result = filterRooms(ROOMS, 31, []);
    expect(result.map((r) => r.code)).not.toContain('A102');
  });

  it('F1: capacity greater than attendees is accepted', () => {
    const result = filterRooms(ROOMS, 29, []);
    expect(result.map((r) => r.code)).toContain('A102');
  });

  it('F2: room with all required equipment is included', () => {
    const result = filterRooms(ROOMS, 1, ['Projector', 'Whiteboard']);
    expect(result.map((r) => r.code)).toContain('A101');
    expect(result.map((r) => r.code)).toContain('B201');
  });

  it('F2: room missing any required equipment is excluded', () => {
    const result = filterRooms(ROOMS, 1, ['Projector', 'Video Conferencing']);
    expect(result.map((r) => r.code)).not.toContain('A101');
    expect(result.map((r) => r.code)).not.toContain('B201');
  });

  it('F2: a required equipment item not present on any room excludes all', () => {
    const result = filterRooms(ROOMS, 1, ['Hologram']);
    expect(result).toEqual([]);
  });

  it('F2: empty required equipment list matches every room on equipment', () => {
    const result = filterRooms(ROOMS, 0, []);
    expect(result.length).toBe(ROOMS.length);
  });

  it('F4: returns an empty array when no rooms match (capacity + equipment)', () => {
    const result = filterRooms(ROOMS, 500, ['Projector']);
    expect(result).toEqual([]);
  });

  it('F3: blocked rooms are not removed solely because they are blocked', () => {
    const result = filterRooms(ROOMS, 1, []);
    expect(result.map((r) => r.code)).toContain('B201');
  });

  it('does not mutate the original rooms array', () => {
    const roomsCopy = ROOMS.map((r) => ({ ...r, equipment: [...r.equipment] }));
    filterRooms(ROOMS, 20, ['Projector']);
    expect(ROOMS).toEqual(roomsCopy);
  });
});
