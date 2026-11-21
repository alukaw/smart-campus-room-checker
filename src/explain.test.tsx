import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  explainAvailability,
  validateExplainInput,
  validateExplainOutput,
  explanationAgreesWithStatus,
  buildMockExplanation,
  fallbackExplanation,
  ExplainValidationError,
  EXPLAIN_TIMEOUT_MS,
} from './explain';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const AVAILABLE_INPUT = {
  roomLabel: 'A101',
  start: 660,
  end: 720,
  isAvailable: true,
  reasonCode: 'AVAILABLE' as const,
};

const OVERLAP_INPUT = {
  roomLabel: 'A101',
  start: 610,
  end: 650,
  isAvailable: false,
  reasonCode: 'OVERLAP' as const,
};

const BLOCKED_INPUT = {
  roomLabel: 'B201',
  start: 660,
  end: 720,
  isAvailable: false,
  reasonCode: 'BLOCKED' as const,
};

const INVALID_INPUT = {
  roomLabel: 'A101',
  start: 600,
  end: 600,
  isAvailable: false,
  reasonCode: 'START_NOT_BEFORE_END' as const,
};

const PAST_INPUT = {
  roomLabel: 'A101',
  start: 500,
  end: 560,
  isAvailable: false,
  reasonCode: 'PAST_TIME' as const,
};

describe('explainAvailability (mock adapter)', () => {
  // Status agreement: the explanation must match the deterministic checker.

  it('explains an available result agreeing with the status', async () => {
    const out = await explainAvailability(AVAILABLE_INPUT);
    expect(out.explanation).toContain('available');
    expect(out.explanation).not.toContain('unavailable');
    expect(out.explanation).toContain('A101');
  });

  it('explains an overlap without inventing booking details', async () => {
    const out = await explainAvailability(OVERLAP_INPUT);
    expect(out.explanation).toContain('unavailable');
    expect(out.explanation).toContain('overlaps');
    // No invented names, times, or bookings beyond the supplied facts.
    expect(out.explanation).not.toContain('Dr.');
    expect(out.explanation).not.toContain('600');
    expect(out.explanation).not.toContain('660');
  });

  it('explains a blocked room agreeing with the status', async () => {
    const out = await explainAvailability(BLOCKED_INPUT);
    expect(out.explanation).toContain('unavailable');
    expect(out.explanation).toContain('blocked for maintenance');
  });

  it('explains an invalid time (start == end) agreeing with the status', async () => {
    const out = await explainAvailability(INVALID_INPUT);
    expect(out.explanation).toContain('unavailable');
    expect(out.explanation).toContain('start time is not before the end time');
  });

  it('explains a past-time rejection agreeing with the status', async () => {
    const out = await explainAvailability(PAST_INPUT);
    expect(out.explanation).toContain('unavailable');
    expect(out.explanation).toContain('current time');
  });

  // Input validation: empty, malformed, overly long.

  it('falls back for empty room label', async () => {
    const out = await explainAvailability({ ...AVAILABLE_INPUT, roomLabel: '   ' });
    expect(out.explanation).toBe(fallbackExplanation({ ...AVAILABLE_INPUT, roomLabel: '   ' }));
  });

  it('falls back for overly long room label (> 40 chars)', async () => {
    const long = 'x'.repeat(41);
    const out = await explainAvailability({ ...AVAILABLE_INPUT, roomLabel: long });
    expect(out.explanation).toBe(fallbackExplanation({ ...AVAILABLE_INPUT, roomLabel: long }));
  });

  it('validateExplainInput rejects malformed times (fractional, out of range)', () => {
    expect(() =>
      validateExplainInput({ ...AVAILABLE_INPUT, start: 600.5 })
    ).toThrow(ExplainValidationError);
    expect(() =>
      validateExplainInput({ ...AVAILABLE_INPUT, start: -1 })
    ).toThrow(ExplainValidationError);
    expect(() =>
      validateExplainInput({ ...AVAILABLE_INPUT, end: 1441 })
    ).toThrow(ExplainValidationError);
  });

  // Timeout: fake timers advance past the 3-second limit.

  it('falls back when the adapter exceeds the timeout', async () => {
    vi.useFakeTimers();
    try {
      const never = new Promise<{ explanation: string }>(() => {});
      const promise = explainAvailability(AVAILABLE_INPUT, {
        adapter: () => never,
        timeoutMs: EXPLAIN_TIMEOUT_MS,
      });
      const assertion = expect(promise).resolves.toEqual({
        explanation: fallbackExplanation(AVAILABLE_INPUT),
      });
      vi.advanceTimersByTime(EXPLAIN_TIMEOUT_MS + 1);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  // Simulated API error.

  it('falls back when the adapter throws', async () => {
    const out = await explainAvailability(AVAILABLE_INPUT, {
      adapter: async () => {
        throw new Error('simulated API failure');
      },
    });
    expect(out.explanation).toBe(fallbackExplanation(AVAILABLE_INPUT));
  });

  // Missing key: in this mock setup there is no key holder; a "no key" adapter
  // throws like a real one would, and the fallback must engage.

  it('falls back when no adapter key is present', async () => {
    const missingKeyAdapter = async (): Promise<{ explanation: string }> => {
      const apiKey: string | undefined = undefined;
      if (!apiKey) throw new Error('missing API key');
      return { explanation: '' };
    };
    const out = await explainAvailability(AVAILABLE_INPUT, { adapter: missingKeyAdapter });
    expect(out.explanation).toBe(fallbackExplanation(AVAILABLE_INPUT));
  });

  // Invalid model output must be rejected → fallback.

  it('rejects invalid model output (wrong shape, too long, 3 sentences, contradicting status)', async () => {
    expect(() => validateExplainOutput(null, AVAILABLE_INPUT)).toThrow(ExplainValidationError);
    expect(() => validateExplainOutput({ nope: 1 }, AVAILABLE_INPUT)).toThrow(
      ExplainValidationError
    );
    expect(() => validateExplainOutput({ explanation: '' }, AVAILABLE_INPUT)).toThrow(
      ExplainValidationError
    );
    expect(() =>
      validateExplainOutput({ explanation: 'a'.repeat(281) }, AVAILABLE_INPUT)
    ).toThrow(ExplainValidationError);
    expect(() =>
      validateExplainOutput(
        { explanation: 'One. Two. Three.' },
        AVAILABLE_INPUT
      )
    ).toThrow(ExplainValidationError);
    // A status contradiction is rejected too: says available for an unavailable result.
    const contradicting = await explainAvailability(OVERLAP_INPUT, {
      adapter: async () => ({
        explanation: 'A101 is available for your slot.',
      }),
    });
    expect(contradicting.explanation).toBe(fallbackExplanation(OVERLAP_INPUT));
    expect(explanationAgreesWithStatus('A101 is available for your slot.', false)).toBe(false);
    // Symmetry: a negated text must also be rejected for an available result.
    expect(
      explanationAgreesWithStatus('The room is not available.', true)
    ).toBe(false);
  });

  // Mock explanation is built purely from structured data.

  it('buildMockExplanation uses only the supplied facts', () => {
    const text = buildMockExplanation(BLOCKED_INPUT);
    expect(text).toContain('B201');
    expect(text).toContain('blocked for maintenance');
    expect(text).toMatch(/^[^.]*B201[^.]*\./);
  });
});

// UI: the button only after a result; label shown; status unchanged after click.

describe('Explain availability UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the mock label and keeps the status unchanged after explaining', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('A101'));
    await user.type(screen.getByLabelText('Start (min)'), '660');
    await user.type(screen.getByLabelText('End (min)'), '720');
    await user.click(screen.getByRole('button', { name: 'Check Availability' }));
    expect(await screen.findByText('Available')).toBeInTheDocument();

    const explainButton = screen.getByRole('button', { name: /Explain availability/i });
    fireEvent.click(explainButton);
    expect(
      await screen.findByText(
        /AI-generated explanation \(mock\) — the confirmed status is shown above/i
      )
    ).toBeInTheDocument();
    // The deterministic status is untouched.
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText(/A101 is available for 11:00–12:00/)).toBeInTheDocument();
    await waitFor(() => {
      expect(explainButton).not.toBeDisabled();
    });
  });

  it('does not show the Explain button before a result exists', () => {
    render(<App />);
    expect(screen.queryByText('A101')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Explain availability/i })
    ).not.toBeInTheDocument();
  });

  it('does not show a stale explanation under a new result', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('A101'));
    await user.type(screen.getByLabelText('Start (min)'), '660');
    await user.type(screen.getByLabelText('End (min)'), '720');
    await user.click(screen.getByRole('button', { name: 'Check Availability' }));
    expect(await screen.findByText('Available')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Explain availability/i }));
    expect(
      await screen.findByText(/is free between/)
    ).toBeInTheDocument();

    // Change times to an overlapping slot; the new result is Unavailable.
    await user.clear(screen.getByLabelText('Start (min)'));
    await user.type(screen.getByLabelText('Start (min)'), '610');
    await user.clear(screen.getByLabelText('End (min)'));
    await user.type(screen.getByLabelText('End (min)'), '650');
    await user.click(screen.getByRole('button', { name: 'Check Availability' }));
    expect(await screen.findByText('Unavailable')).toBeInTheDocument();
    // The old explanation (from the Available result) must not be shown.
    expect(screen.queryByText(/is free between/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/AI-generated explanation \(mock\)/i)
    ).not.toBeInTheDocument();
  });
});
