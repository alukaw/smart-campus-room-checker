import { AlertTriangle } from 'lucide-react';
import { Room } from '../types';

interface RoomCardProps {
  room: Room;
  selected: boolean;
  requiredEquipment: string[];
  onSelect: (roomId: string) => void;
}

export function RoomCard({
  room,
  selected,
  requiredEquipment,
  onSelect,
}: RoomCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(room.id)}
      aria-pressed={selected}
      className={`text-left rounded-xl border p-4 transition focus:outline-none focus:ring-2 focus:ring-teal-500 ${
        selected
          ? 'border-teal-500 ring-2 ring-teal-500 bg-teal-50'
          : room.blocked
          ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-sm text-slate-900">{room.code}</span>
        {room.blocked ? (
          <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Blocked
          </span>
        ) : (
          <span className="text-xs font-medium text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
            Active
          </span>
        )}
      </div>
      <p className="text-xs text-slate-600 mt-1">{room.name}</p>
      <p className="text-xs text-slate-400 mt-1">
        {room.building} · Cap {room.capacity}
      </p>
      {room.equipment.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {room.equipment.map((item) => {
            const required = requiredEquipment.includes(item);
            return (
              <span
                key={item}
                className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                  required
                    ? 'bg-teal-100 border-teal-200 text-teal-800'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                {item}
              </span>
            );
          })}
        </div>
      )}
    </button>
  );
}
