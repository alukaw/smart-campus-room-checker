import { useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import { ROOMS, INITIAL_BOOKINGS } from './data';
import { Booking, Room } from './types';
import { checkAvailability, AvailabilityResult } from './availability';
import { filterRooms } from './filters';
import { AvailabilityForm } from './components/AvailabilityForm';
import { RoomCatalog } from './components/RoomCatalog';

const ALL_EQUIPMENT = Array.from(
  new Set(ROOMS.flatMap((r) => r.equipment))
).sort();

function parseAttendees(value: string): number {
  if (value.trim() === '') return 0;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return -1;
  return n;
}

function App() {
  const [bookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [startStr, setStartStr] = useState('');
  const [endStr, setEndStr] = useState('');
  const [attendeesStr, setAttendeesStr] = useState('');
  const [requiredEquipment, setRequiredEquipment] = useState<string[]>([]);
  const [currentTime] = useState(540); // 09:00 as fictional "now"
  const [result, setResult] = useState<AvailabilityResult | null>(null);

  const attendees = parseAttendees(attendeesStr);
  const attendeesInvalid = attendees === -1;
  const effectiveAttendees = Math.max(0, attendees);

  const filteredRooms: Room[] = useMemo(
    () => filterRooms(ROOMS, effectiveAttendees, requiredEquipment),
    [effectiveAttendees, requiredEquipment]
  );

  const selectedRoom: Room | undefined = useMemo(
    () => ROOMS.find((r) => r.id === selectedRoomId),
    [selectedRoomId]
  );

  // If the selected room no longer matches the filters, clear it (and any result).
  const selectedRoomStillVisible = useMemo(
    () =>
      selectedRoomId === '' ||
      filteredRooms.some((r) => r.id === selectedRoomId),
    [filteredRooms, selectedRoomId]
  );

  const effectiveSelectedRoom = selectedRoomStillVisible ? selectedRoom : undefined;
  const effectiveSelectedRoomId = selectedRoomStillVisible ? selectedRoomId : '';

  const roomBookings = bookings
    .filter((b) => b.roomCode === effectiveSelectedRoom?.code)
    .sort((a, b) => a.start - b.start);

  function clearResult() {
    setResult(null);
  }

  function handleSubmit() {
    const room = effectiveSelectedRoom;
    if (!room) {
      setResult({ available: false, reason: 'Please select a room from the catalog.' });
      return;
    }
    const res = checkAvailability(room, startStr, endStr, currentTime, bookings);
    setResult(res);
  }

  function selectRoom(roomId: string) {
    setSelectedRoomId(roomId);
    clearResult();
  }

  function toggleEquipment(item: string) {
    setRequiredEquipment((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
    clearResult();
  }

  function clearEquipment() {
    setRequiredEquipment([]);
    clearResult();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-sm">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              Smart Campus Room Availability
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Find a room that fits your group and equipment, then check a time slot.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <AvailabilityForm
            attendeesStr={attendeesStr}
            attendeesInvalid={attendeesInvalid}
            onAttendeesChange={(v) => { setAttendeesStr(v); clearResult(); }}
            allEquipment={ALL_EQUIPMENT}
            requiredEquipment={requiredEquipment}
            onToggleEquipment={toggleEquipment}
            onClearEquipment={clearEquipment}
            selectedRoom={effectiveSelectedRoom}
            startStr={startStr}
            endStr={endStr}
            currentTime={currentTime}
            onStartChange={(v) => { setStartStr(v); clearResult(); }}
            onEndChange={(v) => { setEndStr(v); clearResult(); }}
            result={result}
            onSubmit={handleSubmit}
          />
          <RoomCatalog
            rooms={filteredRooms}
            totalRoomCount={ROOMS.length}
            selectedRoomId={effectiveSelectedRoomId}
            selectedRoom={effectiveSelectedRoom}
            roomBookings={roomBookings}
            requiredEquipment={requiredEquipment}
            onSelectRoom={selectRoom}
          />
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center">
        <p className="text-xs text-slate-400">
          Fictional sample data · No real bookings are created or modified.
        </p>
      </footer>
    </div>
  );
}

export default App;
