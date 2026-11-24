import { useState } from 'react';
import { Clock, Lock, ListChecks } from 'lucide-react';
import { INITIAL_BOOKINGS, ROOMS } from '../data';
import { checkContract, A101_CODE, formatHHMM } from '../contract';
import { Booking } from '../types';

const A101_ROOM = ROOMS.find((r) => r.code === A101_CODE);
const A101_BOOKINGS: Booking[] = INITIAL_BOOKINGS.filter(
  (b) => b.roomCode === A101_CODE
).sort((a, b) => a.start - b.start);

const STATUS_STYLES: Record<'AVAILABLE' | 'BLOCKED' | 'OVERLAP' | 'INVALID', string> = {
  AVAILABLE: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  BLOCKED: 'bg-rose-50 border-rose-200 text-rose-800',
  OVERLAP: 'bg-rose-50 border-rose-200 text-rose-800',
  INVALID: 'bg-amber-50 border-amber-200 text-amber-800',
};

function styleFor(reasonCode: string): string {
  if (reasonCode === 'AVAILABLE') return STATUS_STYLES.AVAILABLE;
  if (reasonCode === 'BLOCKED' || reasonCode === 'OVERLAP') return STATUS_STYLES[reasonCode];
  return STATUS_STYLES.INVALID;
}

function toneFor(reasonCode: string): string {
  return reasonCode === 'AVAILABLE'
    ? 'Available'
    : reasonCode === 'BLOCKED' || reasonCode === 'OVERLAP'
      ? 'Unavailable'
      : 'Invalid input';
}

export default function ContractChecker() {
  const [startTime, setStartTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof checkContract> | null>(
    null
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(checkContract(startTime, durationMinutes, blocked, INITIAL_BOOKINGS));
  }

  return (
    <section
      aria-label="Single-room availability checker"
      className="max-w-xl mx-auto w-full"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-600" />
            Single-room checker — {A101_CODE}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Fixed demo time 09:00. Bookings are read-only; nothing is created or changed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="contract-start"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Start time
              </label>
              <input
                id="contract-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label
                htmlFor="contract-duration"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Duration (minutes)
              </label>
              <input
                id="contract-duration"
                type="number"
                inputMode="numeric"
                min={1}
                max={120}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="e.g. 60"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={blocked}
              onChange={(e) => setBlocked(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            Room blocked for maintenance
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-medium text-sm py-2.5 transition-colors shadow-sm"
          >
            Check A101
          </button>
        </form>

        {result && (
          <div
            role="status"
            className={`rounded-lg border p-4 ${styleFor(result.reasonCode)}`}
          >
            <p className="text-sm font-semibold">{toneFor(result.reasonCode)}</p>
            <p className="text-sm mt-0.5">{result.message}</p>
            <p className="text-xs font-mono mt-1 opacity-75">
              Reason code: {result.reasonCode}
            </p>
          </div>
        )}

        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs">
          <p className="font-medium text-slate-600 flex items-center gap-1.5 mb-1.5">
            <ListChecks className="w-3.5 h-3.5" />
            {A101_CODE} bookings (read-only)
          </p>
          {A101_ROOM && (
            <p className="text-slate-500 mb-1.5">
              {A101_ROOM.name} · {A101_ROOM.building} · capacity {A101_ROOM.capacity}
            </p>
          )}
          <ul className="space-y-1">
            {A101_BOOKINGS.map((b) => (
              <li key={b.id} className="flex items-center gap-1.5 text-slate-600">
                <Clock className="w-3 h-3 shrink-0" />
                {formatHHMM(b.start)}-{formatHHMM(b.end)} · booked by {b.bookedBy}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
