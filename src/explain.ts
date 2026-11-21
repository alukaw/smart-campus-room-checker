import { ReasonCode } from './availability';

/**
 * Mock explanation adapter. Deterministic, offline, no keys, no fetch.
 * The deterministic checkAvailability() remains the single source of truth:
 * this module only restates facts it was given and never changes the status.
 * The adapter is a parameter so a future server-side adapter can be swapped
 * in without touching callers. No fetch calls, no keys in the browser.
 */

export interface ExplainInput {
  roomLabel: string;
  start: number;
  end: number;
  isAvailable: boolean;
  reasonCode: ReasonCode;
}

export interface ExplainOutput {
  explanation: string;
}

export const EXPLAIN_TIMEOUT_MS = 3000;
export const MAX_ROOM_LABEL_LENGTH = 40;
export const MAX_EXPLANATION_LENGTH = 280;

export type ExplainAdapter = (input: ExplainInput) => Promise<ExplainOutput>;

export class ExplainValidationError extends Error {}

export const SYSTEM_INSTRUCTION = [
  'You explain a room availability result.',
  'Use only the facts supplied in the input; invent no bookings, names, or times.',
  'Write at most two sentences.',
  'Never contradict or override the given availability status.',
].join(' ');

export function validateExplainInput(input: ExplainInput): void {
  if (
    typeof input.roomLabel !== 'string' ||
    input.roomLabel.trim() === '' ||
    input.roomLabel.length > MAX_ROOM_LABEL_LENGTH
  ) {
    throw new ExplainValidationError('Invalid room label.');
  }
  if (
    !Number.isInteger(input.start) ||
    !Number.isInteger(input.end) ||
    input.start < 0 ||
    input.start > 1440 ||
    input.end < 0 ||
    input.end > 1440
  ) {
    throw new ExplainValidationError('Invalid times.');
  }
  if (typeof input.isAvailable !== 'boolean') {
    throw new ExplainValidationError('Invalid availability status.');
  }
}

const SENTENCE_END = /[.!?](?:\s|$)/g;

export function explanationAgreesWithStatus(
  explanation: string,
  isAvailable: boolean
): boolean {
  const saysAvailableWord = /\bavailable\b/i.test(explanation);
  const negated = /\b(not|unavailable|cannot|can't|isn't|never)\b/i.test(explanation);
  const effectivelyAvailable = saysAvailableWord && !negated;
  if (isAvailable) {
    // Symmetric with the unavailable case: the text must affirm availability,
    // so a negated phrase like "not available" is rejected.
    return effectivelyAvailable;
  }
  // Unavailable status: the text must not affirm availability.
  return !effectivelyAvailable;
}

function validateShapeAndLength(output: unknown): ExplainOutput {
  if (
    typeof output !== 'object' ||
    output === null ||
    !('explanation' in output) ||
    typeof (output as { explanation: unknown }).explanation !== 'string'
  ) {
    throw new ExplainValidationError('Malformed model output.');
  }
  const explanation = (output as { explanation: string }).explanation.trim();
  if (explanation === '' || explanation.length > MAX_EXPLANATION_LENGTH) {
    throw new ExplainValidationError('Explanation length out of bounds.');
  }
  const sentences = explanation.match(SENTENCE_END)?.length ?? 0;
  if (sentences === 0 || sentences > 2) {
    throw new ExplainValidationError('Explanation must be one or two sentences.');
  }
  return { explanation };
}

export function validateExplainOutput(
  output: unknown,
  input: ExplainInput
): ExplainOutput {
  const validated = validateShapeAndLength(output);
  if (!explanationAgreesWithStatus(validated.explanation, input.isAvailable)) {
    throw new ExplainValidationError('Explanation contradicts the confirmed status.');
  }
  return validated;
}

export function buildMockExplanation(input: ExplainInput): string {
  const { roomLabel, start, end, reasonCode } = input;
  switch (reasonCode) {
    case 'AVAILABLE':
      return `${roomLabel} is free between ${formatMinutes(start)} and ${formatMinutes(end)}, so the requested slot is available.`;
    case 'OVERLAP':
      return `${roomLabel} is unavailable because the requested slot overlaps an existing booking.`;
    case 'BLOCKED':
      return `${roomLabel} is unavailable because the room is blocked for maintenance.`;
    case 'TOO_LONG':
      return `${roomLabel} is unavailable because the requested booking is longer than 120 minutes.`;
    case 'PAST_TIME':
      return `${roomLabel} is unavailable because the requested start is not after the current time.`;
    case 'START_NOT_BEFORE_END':
      return `${roomLabel} is unavailable because the start time is not before the end time.`;
    case 'OUT_OF_RANGE':
      return `${roomLabel} is unavailable because the times must lie within 0 to 1440 minutes.`;
    case 'INVALID_INPUT':
    case 'NO_ROOM':
    default:
      return `${roomLabel} is unavailable because the request details are incomplete or invalid.`;
  }
}

export function fallbackExplanation(input: ExplainInput): string {
  const status = input.isAvailable ? 'available' : 'unavailable';
  return `The confirmed status is ${status}. Reason code: ${input.reasonCode}.`;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const mockAdapter: ExplainAdapter = async (input) => {
  validateExplainInput(input);
  return { explanation: buildMockExplanation(input) };
};

export interface ExplainDeps {
  adapter?: ExplainAdapter;
  timeoutMs?: number;
}

export async function explainAvailability(
  input: ExplainInput,
  deps: ExplainDeps = {}
): Promise<ExplainOutput> {
  try {
    validateExplainInput(input);
  } catch {
    return { explanation: fallbackExplanation(input) };
  }

  const adapter = deps.adapter ?? mockAdapter;
  const timeoutMs = deps.timeoutMs ?? EXPLAIN_TIMEOUT_MS;

  try {
    const output = await withTimeout(adapter(input), timeoutMs);
    return validateExplainOutput(output, input);
  } catch {
    return { explanation: fallbackExplanation(input) };
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
