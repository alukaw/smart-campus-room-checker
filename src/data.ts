import { Room, Booking } from './types';

export const ROOMS: Room[] = [
  {
    id: 'room-a101',
    code: 'A101',
    name: 'Lecture Hall A1',
    building: 'Engineering Block',
    capacity: 120,
    equipment: ['Projector', 'Microphone', 'Whiteboard', 'Lecture Capture'],
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
    id: 'room-b202',
    code: 'B202',
    name: 'Chemistry Lab B2',
    building: 'Science Block',
    capacity: 24,
    equipment: ['Fume Hood', 'Lab Benches', 'Whiteboard'],
    blocked: false,
  },
  {
    id: 'room-c301',
    code: 'C301',
    name: 'Auditorium C3',
    building: 'Central Wing',
    capacity: 300,
    equipment: ['Projector', 'Microphone', 'Stage Lighting', 'Video Conferencing'],
    blocked: false,
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

// All sample bookings are in the future relative to a default currentTime of 9:00 (540 min)
export const INITIAL_BOOKINGS: Booking[] = [
  { id: 1, roomCode: 'A101', start: 600, end: 660, bookedBy: 'Dr. Smith' },
  { id: 2, roomCode: 'A101', start: 720, end: 780, bookedBy: 'Prof. Lee' },
  { id: 3, roomCode: 'A102', start: 540, end: 600, bookedBy: 'TA Patel' },
  { id: 4, roomCode: 'B202', start: 660, end: 720, bookedBy: 'Dr. Garcia' },
  { id: 5, roomCode: 'C301', start: 540, end: 600, bookedBy: 'Events Office' },
  { id: 6, roomCode: 'C302', start: 780, end: 840, bookedBy: 'Admin' },
];
