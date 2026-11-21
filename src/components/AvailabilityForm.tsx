import {
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  AlertTriangle,
  Search,
  Wrench,
  X,
  MapPin,
} from 'lucide-react';
import { Room } from '../types';
import { AvailabilityResult, formatTime } from '../availability';

interface AvailabilityFormProps {
  attendeesStr: string;
  attendeesInvalid: boolean;
  onAttendeesChange: (value: string) => void;

  allEquipment: string[];
  requiredEquipment: string[];
  onToggleEquipment: (item: string) => void;
  onClearEquipment: () => void;

  selectedRoom: Room | undefined;

  startStr: string;
  endStr: string;
  currentTime: number;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;

  result: AvailabilityResult | null;
  onSubmit: () => void;
}

export function AvailabilityForm({
  attendeesStr,
  attendeesInvalid,
  onAttendeesChange,
  allEquipment,
  requiredEquipment,
  onToggleEquipment,
  onClearEquipment,
  selectedRoom,
  startStr,
  endStr,
  currentTime,
  onStartChange,
  onEndChange,
  result,
  onSubmit,
}: AvailabilityFormProps) {
  return (
    <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Search className="w-4 h-4 text-teal-600" />
        Check Availability
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        {/* Attendees */}
        <div>
          <label
            htmlFor="attendees"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Attendees
          </label>
          <input
            id="attendees"
            type="number"
            min={0}
            step={1}
            value={attendeesStr}
            onChange={(e) => onAttendeesChange(e.target.value)}
            placeholder="e.g. 25"
            aria-invalid={attendeesInvalid}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${
              attendeesInvalid
                ? 'border-rose-300 focus:ring-rose-500'
                : 'border-slate-300 focus:ring-teal-500'
            }`}
          />
          {attendeesInvalid && (
            <p className="text-xs text-rose-600 mt-1">
              Enter a whole number of 0 or more.
            </p>
          )}
          <p className="text-xs text-slate-400 mt-1">
            Rooms with at least this many seats will be shown.
          </p>
        </div>

        {/* Required equipment */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="block text-sm font-medium text-slate-700">
              Required Equipment
            </span>
            {requiredEquipment.length > 0 && (
              <button
                type="button"
                onClick={onClearEquipment}
                className="text-xs text-teal-700 hover:text-teal-800 font-medium inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {allEquipment.map((item) => {
              const active = requiredEquipment.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onToggleEquipment(item)}
                  aria-pressed={active}
                  className={`text-xs px-2.5 py-1.5 rounded-full border transition ${
                    active
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'bg-white border-slate-300 text-slate-600 hover:border-teal-400 hover:text-teal-700'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            A room must have every selected item to match.
          </p>
        </div>

        {/* Selected room info */}
        {selectedRoom && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-slate-600">
              <MapPin className="w-3.5 h-3.5" /> {selectedRoom.building}
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Users className="w-3.5 h-3.5" /> Capacity: {selectedRoom.capacity}
            </div>
            {selectedRoom.equipment.length > 0 && (
              <div className="flex items-start gap-1.5 text-slate-600">
                <Wrench className="w-3.5 h-3.5 mt-0.5" />
                <span>{selectedRoom.equipment.join(', ')}</span>
              </div>
            )}
            {selectedRoom.blocked && (
              <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" /> Blocked for maintenance
              </div>
            )}
          </div>
        )}

        {/* Time inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="start"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Start (min)
            </label>
            <input
              id="start"
              type="number"
              min={0}
              max={1440}
              value={startStr}
              onChange={(e) => onStartChange(e.target.value)}
              placeholder="e.g. 660"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label
              htmlFor="end"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              End (min)
            </label>
            <input
              id="end"
              type="number"
              min={0}
              max={1440}
              value={endStr}
              onChange={(e) => onEndChange(e.target.value)}
              placeholder="e.g. 720"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            />
          </div>
        </div>

        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Current time: {formatTime(currentTime)} ({currentTime} min). Enter times in minutes 0–1440.
        </p>

        <button
          type="submit"
          className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-medium text-sm py-2.5 transition-colors shadow-sm"
        >
          Check Availability
        </button>
      </form>

      {/* Result */}
      {result && (
        <div
          className={`mt-4 rounded-lg p-4 flex items-start gap-3 transition-all ${
            result.available
              ? 'bg-emerald-50 border border-emerald-200'
              : 'bg-rose-50 border border-rose-200'
          }`}
        >
          {result.available ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div>
            <p
              className={`text-sm font-semibold ${
                result.available ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {result.available ? 'Available' : 'Unavailable'}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">{result.reason}</p>
          </div>
        </div>
      )}
    </section>
  );
}
