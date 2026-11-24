import { describe, it, expect } from 'vitest';
import {
  checkContract,
  validateContractInput,
  parseStartTime,
  A101_CODE,
  A101_CURRENT_TIME,
  A101_DAY_END,
} from './contract';
import { INITIAL_BOOKINGS, ROOMS } from './data';

function contract(start: string, duration: string, blocked: boolean = false) {
  return checkContract(start, duration, blocked, INITIAL_BOOKINGS);
}

describe('Practice 12 contract', () => {
  it('T1 13:30/60/open -> AVAILABLE', () => {
    const r = contract('13:30', '60');
    expect(r.available).toBe(true);
    expect(r.reasonCode).toBe('AVAILABLE');
    expect(r.message).toBe('Available: A101 is free from 13:30 to 14:30.');
  });

  it('T2 10:30/60/open -> OVERLAP 10:00-11:00', () => {
    const r = contract('10:30', '60');
    expect(r.available).toBe(false);
    expect(r.reasonCode).toBe('OVERLAP');
    expect(r.message).toBe('Unavailable: overlaps the existing booking 10:00-11:00.');
  });

  it('T3 13:30/60/blocked -> BLOCKED', () => {
    const r = contract('13:30', '60', true);
    expect(r.available).toBe(false);
    expect(r.reasonCode).toBe('BLOCKED');
    expect(r.message).toBe('Unavailable: A101 is blocked for maintenance.');
  });

  it('T4 13:30/0 -> INVALID_DURATION', () => {
    const r = contract('13:30', '0');
    expect(r.available).toBe(false);
    expect(r.reasonCode).toBe('INVALID_DURATION');
    expect(r.message).toBe('Invalid input: duration must be a whole number from 1 to 120 minutes.');
  });

  it('T5 13:30/121 -> INVALID_DURATION', () => {
    const r = contract('13:30', '121');
    expect(r.available).toBe(false);
    expect(r.reasonCode).toBe('INVALID_DURATION');
    expect(r.message).toBe('Invalid input: duration must be a whole number from 1 to 120 minutes.');
  });

  it('T6 08:00/30 -> PAST_START', () => {
    const r = contract('08:00', '30');
    expect(r.available).toBe(false);
    expect(r.reasonCode).toBe('PAST_START');
    expect(r.message).toBe('Invalid input: start time must be after the current time (09:00).');
  });

  it('T7 11:00/60/open -> AVAILABLE (adjacent to both bookings)', () => {
    const r = contract('11:00', '60');
    expect(r.available).toBe(true);
    expect(r.reasonCode).toBe('AVAILABLE');
    expect(r.message).toBe('Available: A101 is free from 11:00 to 12:00.');
  });

  it('T8 inputs are not mutated (bookings and ROOMS deep-equal a pre-run clone)', () => {
    const bookingsBefore = structuredClone(INITIAL_BOOKINGS);
    const roomsBefore = structuredClone(ROOMS);
    contract('13:30', '60');
    contract('10:30', '60');
    contract('13:30', '60', true);
    contract('13:30', '0');
    contract('13:30', '121');
    contract('08:00', '30');
    contract('11:00', '60');
    contract('', '');
    contract('25:99', 'abc');
    contract('23:30', '60');
    expect(INITIAL_BOOKINGS).toStrictEqual(bookingsBefore);
    expect(ROOMS).toStrictEqual(roomsBefore);
  });

  // Extra coverage beyond T1-T8.

  it('INVALID_START: empty start', () => {
    const r = contract('', '60');
    expect(r.reasonCode).toBe('INVALID_START');
    expect(r.message).toBe('Invalid input: enter the start time as HH:MM.');
  });

  it('INVALID_START: malformed start', () => {
    for (const bad of ['9:00', '09:60', 'ab:cd', '0930', '09:30:00', '-1:00']) {
      expect(contract(bad, '60').reasonCode).toBe('INVALID_START');
    }
  });

  it('ENDS_AFTER_DAY: 23:30/60 -> must end by 24:00', () => {
    const r = contract('23:30', '60');
    expect(r.available).toBe(false);
    expect(r.reasonCode).toBe('ENDS_AFTER_DAY');
    expect(r.message).toBe('Invalid input: the booking must end by 24:00.');
  });

  it('exactly 120 minutes is allowed', () => {
    const r = contract('13:30', '120');
    expect(r.available).toBe(true);
    expect(r.reasonCode).toBe('AVAILABLE');
  });

  it('INVALID_DURATION: non-whole and non-numeric durations', () => {
    for (const bad of ['', 'abc', '1.5', '-5']) {
      expect(contract('13:30', bad).reasonCode).toBe('INVALID_DURATION');
    }
  });

  it('parseStartTime: HH:MM within 00:00-23:59 only', () => {
    expect(parseStartTime('09:30')).toBe(570);
    expect(parseStartTime('00:00')).toBe(0);
    expect(parseStartTime('23:59')).toBe(1439);
    for (const bad of ['', '9:00', '09:60', '24:00', 'ab:cd']) {
      expect(parseStartTime(bad)).toBeNull();
    }
  });

  it('validateContractInput: ordered checks (start, duration, day end, past start)', () => {
    const ok = validateContractInput('13:30', '60');
    expect(ok).toStrictEqual({ ok: true, start: 810, duration: 60 });
    const err = (s: string, d: string) => validateContractInput(s, d).error;
    expect(err('nope', '60')?.code).toBe('INVALID_START');
    expect(err('13:30', 'x')?.code).toBe('INVALID_DURATION');
    expect(err('23:30', '60')?.code).toBe('ENDS_AFTER_DAY');
    expect(err('08:00', '30')?.code).toBe('PAST_START');
  });

  it('A101 has its two existing bookings at 10:00-11:00 and 12:00-13:00', () => {
    const a101 = INITIAL_BOOKINGS.filter((b) => b.roomCode === A101_CODE);
    expect(a101.map((b) => [b.start, b.end])).toStrictEqual([
      [600, 660],
      [720, 780],
    ]);
    expect(A101_CURRENT_TIME).toBe(540);
    expect(A101_DAY_END).toBe(1440);
  });
});
