export interface Booking {
  id: number;
  roomCode: string;
  start: number; // minutes from 00:00
  end: number;   // minutes from 00:00
  bookedBy: string;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  building: string;
  capacity: number;
  equipment: string[];
  blocked: boolean;
}
