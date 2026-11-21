import { Clock, Filter } from 'lucide-react';
import { Booking, Room } from '../types';
import { formatTime } from '../availability';
import { RoomCard } from './RoomCard';

interface RoomCatalogProps {
  rooms: Room[];
  totalRoomCount: number;
  selectedRoomId: string;
  selectedRoom: Room | undefined;
  roomBookings: Booking[];
  requiredEquipment: string[];
  onSelectRoom: (roomId: string) => void;
}

export function RoomCatalog({
  rooms,
  totalRoomCount,
  selectedRoomId,
  selectedRoom,
  roomBookings,
  requiredEquipment,
  onSelectRoom,
}: RoomCatalogProps) {
  return (
    <section className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Filter className="w-4 h-4 text-teal-600" />
          Room Catalog
        </h2>
        <span className="text-xs text-slate-400">
          {rooms.length} of {totalRoomCount} rooms
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Filter by attendees and equipment, then select a room to check a time slot.
      </p>

      {rooms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-700">
            No rooms match your requirements.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Try fewer attendees or less equipment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              selected={room.id === selectedRoomId}
              requiredEquipment={requiredEquipment}
              onSelect={onSelectRoom}
            />
          ))}
        </div>
      )}

      {/* Bookings for selected room */}
      {selectedRoom && (
        <div className="mt-6 pt-5 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            Existing bookings for {selectedRoom.code}
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            The availability check uses only this room's bookings. Touching endpoints
            (e.g. 660→720 then 720→780) are allowed.
          </p>
          <div className="space-y-2">
            {roomBookings.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">
                No existing bookings for {selectedRoom.code}.
              </p>
            ) : (
              roomBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {formatTime(b.start)} – {formatTime(b.end)}
                      </p>
                      <p className="text-xs text-slate-400">Booked by {b.bookedBy}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{b.end - b.start} min</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
