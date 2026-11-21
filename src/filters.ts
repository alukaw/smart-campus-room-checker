import { Room } from './types';

/**
 * Pure filter for the room catalog.
 *
 * A room is included when:
 *   - its capacity is at least `attendees` (F1), and
 *   - it has every item in `requiredEquipment` (F2).
 *
 * Blocked rooms are NOT removed here — their blocked status stays visible in the
 * catalog (F3). Booking/overlap availability is handled separately by
 * `checkAvailability`, so this function intentionally does not look at bookings.
 *
 * Never mutates the input `rooms` array.
 */
export function filterRooms(
  rooms: Room[],
  attendees: number,
  requiredEquipment: string[]
): Room[] {
  return rooms.filter((room) => {
    if (room.capacity < attendees) {
      return false;
    }
    for (const item of requiredEquipment) {
      if (!room.equipment.includes(item)) {
        return false;
      }
    }
    return true;
  });
}
