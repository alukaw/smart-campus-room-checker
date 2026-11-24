export default {
  // Fixed fictional context (same as the code-based app)
  NOW: 540,           // 09:00
  ROOM: 'A101',
  MAX_DURATION: 120,
  DAY_END: 1440,      // 24:00
  // Fictional bookings for room A101 (copied from src/data.ts). Read-only.
  bookings: [
    { id: 1, start: 600, end: 660, bookedBy: 'Dr. Smith' },
    { id: 2, start: 720, end: 780, bookedBy: 'Prof. Lee' }
  ],
  SNAPSHOT: '[{"id":1,"start":600,"end":660,"bookedBy":"Dr. Smith"},{"id":2,"start":720,"end":780,"bookedBy":"Prof. Lee"}]',
  result: { available: false, reasonCode: 'NONE', status: 'Not checked', message: 'Enter a start time and a duration, then press Check A101.' },
  testRows: [],

  fmt (m) {
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  },

  make (available, reasonCode, message) {
    const status = available ? 'Available' : (message.startsWith('Invalid input') ? 'Invalid input' : 'Unavailable');
    return { available, reasonCode, status, message };
  },

  // Validation layer (AC1, AC2, AC6): returns { error } or { start, end }
  validate (startText, durationText) {
    const s = String(startText ?? '');
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(s);
    if (!match) {
      return { error: this.make(false, 'INVALID_START', 'Invalid input: enter the start time as HH:MM.') };
    }
    const d = String(durationText ?? '').trim();
    const duration = Number(d);
    if (d === '' || !Number.isInteger(duration) || duration <= 0 || duration > this.MAX_DURATION) {
      return { error: this.make(false, 'INVALID_DURATION', 'Invalid input: duration must be a whole number from 1 to 120 minutes.') };
    }
    const start = Number(match[1]) * 60 + Number(match[2]);
    const end = start + duration;
    if (end > this.DAY_END) {
      return { error: this.make(false, 'ENDS_AFTER_DAY', 'Invalid input: the booking must end by 24:00.') };
    }
    if (start <= this.NOW) {
      return { error: this.make(false, 'PAST_START', 'Invalid input: start time must be after the current time (09:00).') };
    }
    return { start, end };
  },

  // Calculation layer (AC3, AC4, AC5): pure decision, never changes this.bookings
  decide (start, end, blocked) {
    if (blocked) {
      return this.make(false, 'BLOCKED', 'Unavailable: A101 is blocked for maintenance.');
    }
    const hit = this.bookings.find(b => start < b.end && end > b.start);
    if (hit) {
      return this.make(false, 'OVERLAP', 'Unavailable: overlaps the existing booking ' + this.fmt(hit.start) + '-' + this.fmt(hit.end) + '.');
    }
    return this.make(true, 'AVAILABLE', 'Available: A101 is free from ' + this.fmt(start) + ' to ' + this.fmt(end) + '.');
  },

  evaluate (startText, durationText, blocked) {
    const v = this.validate(startText, durationText);
    return v.error ? v.error : this.decide(v.start, v.end, blocked === true);
  },

  // UI glue: onClick of the "Check A101" button
  check () {
    this.result = this.evaluate(StartInput.text, DurationInput.text, BlockedSwitch.isSwitchedOn);
    return this.result;
  },

  bookingsUnchanged () {
    return JSON.stringify(this.bookings) === this.SNAPSHOT;
  },

  bookingRows () {
    return this.bookings.map(b => ({ id: b.id, time: this.fmt(b.start) + '-' + this.fmt(b.end), bookedBy: b.bookedBy }));
  },

  // Workaround self-test (Appsmith has no built-in test runner): T1-T7 through evaluate(), T8 on the data
  runContractTests () {
    const cases = [
      ['T1', '13:30', '60', false, true, 'AVAILABLE'],
      ['T2', '10:30', '60', false, false, 'OVERLAP'],
      ['T3', '13:30', '60', true, false, 'BLOCKED'],
      ['T4', '13:30', '0', false, false, 'INVALID_DURATION'],
      ['T5', '13:30', '121', false, false, 'INVALID_DURATION'],
      ['T6', '08:00', '30', false, false, 'PAST_START'],
      ['T7', '11:00', '60', false, true, 'AVAILABLE']
    ];
    const rows = cases.map(c => {
      const r = this.evaluate(c[1], c[2], c[3]);
      return { test: c[0], input: c[1] + ' / ' + c[2] + ' min / ' + (c[3] ? 'blocked' : 'open'), expected: c[5], observed: r.reasonCode, message: r.message, pass: r.available === c[4] && r.reasonCode === c[5] };
    });
    rows.push({ test: 'T8', input: 'after T1-T7', expected: 'bookings unchanged', observed: this.bookingsUnchanged() ? 'unchanged' : 'CHANGED', message: JSON.stringify(this.bookings), pass: this.bookingsUnchanged() });
    this.testRows = rows;
    return rows;
  }
}
