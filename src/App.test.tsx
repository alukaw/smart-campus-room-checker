import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find the catalog room card button whose heading text starts with `code`. */
async function findRoomCard(code: string) {
  // Room codes are rendered as bold spans inside <button> cards.
  const cards = screen.getAllByRole('button');
  return cards.find((btn) => {
    const span = btn.querySelector('span.font-semibold');
    return span?.textContent === code;
  });
}

async function selectRoom(code: string, user: ReturnType<typeof userEvent.setup>) {
  const card = await findRoomCard(code);
  if (!card) throw new Error(`Room card ${code} not found in catalog`);
  await user.click(card);
}

/** All room codes rendered as bold headings in the catalog. */
function catalogCodes(): string[] {
  const cards = screen.getAllByRole('button');
  const codes: string[] = [];
  for (const btn of cards) {
    const span = btn.querySelector('span.font-semibold');
    if (span && /^[A-Z]\d+$/.test(span.textContent ?? '')) {
      codes.push(span.textContent ?? '');
    }
  }
  return codes;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('App room catalog and availability UI', () => {
  beforeEach(() => {
    render(<App />);
  });

  // D1: page initially displays all six rooms, including blocked B201
  it('D1: initially displays all six rooms, including blocked B201', () => {
    const codes = catalogCodes();
    expect(codes).toEqual(
      expect.arrayContaining(['A101', 'A102', 'B201', 'B202', 'C301', 'C302'])
    );
    expect(codes.length).toBe(6);
  });

  // D2: entering 30 attendees still displays A102 (exact capacity)
  it('D2: 30 attendees keeps A102 visible (exact capacity match)', async () => {
    const user = userEvent.setup();
    const attendees = screen.getByLabelText('Attendees');
    await user.type(attendees, '30');
    const codes = catalogCodes();
    expect(codes).toContain('A102');
  });

  // D3: entering 31 attendees hides A102
  it('D3: 31 attendees hides A102 (insufficient capacity)', async () => {
    const user = userEvent.setup();
    const attendees = screen.getByLabelText('Attendees');
    await user.type(attendees, '31');
    const codes = catalogCodes();
    expect(codes).not.toContain('A102');
  });

  // D4: selecting Projector and Whiteboard displays only rooms containing both
  it('D4: Projector + Whiteboard shows only rooms that have both', async () => {
    const user = userEvent.setup();
    const projectorChip = await screen.findByRole('button', { name: 'Projector' });
    const whiteboardChip = await screen.findByRole('button', { name: 'Whiteboard' });
    await user.click(projectorChip);
    await user.click(whiteboardChip);
    const codes = catalogCodes();
    // Rooms with both Projector and Whiteboard: A101, B201
    expect(codes).toEqual(expect.arrayContaining(['A101', 'B201']));
    expect(codes).not.toContain('A102');
    expect(codes).not.toContain('B202');
    expect(codes).not.toContain('C302');
  });

  // D5: a combination with no matching rooms displays the empty-state message
  it('D5: no matching rooms shows the empty-state message', async () => {
    const user = userEvent.setup();
    // Stage Lighting is only on C301 (cap 300). Require it plus Fume Hood
    // (only on B202) — no single room has both.
    const stageChip = await screen.findByRole('button', { name: 'Stage Lighting' });
    const fumeChip = await screen.findByRole('button', { name: 'Fume Hood' });
    await user.click(stageChip);
    await user.click(fumeChip);
    expect(
      screen.getByText('No rooms match your requirements.')
    ).toBeInTheDocument();
  });

  // D6: selecting A101 and checking 660–720 produces Available
  it('D6: A101, 660–720 produces Available (gap between existing bookings)', async () => {
    const user = userEvent.setup();
    await selectRoom('A101', user);
    await user.type(screen.getByLabelText('Start (min)'), '660');
    await user.type(screen.getByLabelText('End (min)'), '720');
    await user.click(screen.getByRole('button', { name: 'Check Availability' }));
    expect(await screen.findByText('Available')).toBeInTheDocument();
  });

  // D7: switching from A101 to B201 clears the previous result; B201 is Unavailable
  it('D7: switching A101 -> B201 clears the result and B201 is Unavailable (blocked)', async () => {
    const user = userEvent.setup();
    await selectRoom('A101', user);
    await user.type(screen.getByLabelText('Start (min)'), '660');
    await user.type(screen.getByLabelText('End (min)'), '720');
    await user.click(screen.getByRole('button', { name: 'Check Availability' }));
    expect(await screen.findByText('Available')).toBeInTheDocument();

    // Switch to B201 (blocked)
    await selectRoom('B201', user);
    // Previous Available result must be cleared
    expect(screen.queryByText('Available')).not.toBeInTheDocument();
    // B201 must be selected; check with same valid interval -> Unavailable (blocked)
    // Clear first, since time inputs are intentionally retained across room switches.
    const startInput = screen.getByLabelText('Start (min)');
    const endInput = screen.getByLabelText('End (min)');
    await user.clear(startInput);
    await user.clear(endInput);
    await user.type(startInput, '660');
    await user.type(endInput, '720');
    await user.click(screen.getByRole('button', { name: 'Check Availability' }));
    expect(await screen.findByText('Unavailable')).toBeInTheDocument();
  });

  // D8: an overlapping booking interval produces Unavailable
  it('D8: A101, 610–650 overlaps an existing booking -> Unavailable', async () => {
    const user = userEvent.setup();
    await selectRoom('A101', user);
    // A101 has a booking 600–660 (Dr. Smith). 610–650 is fully inside it.
    await user.type(screen.getByLabelText('Start (min)'), '610');
    await user.type(screen.getByLabelText('End (min)'), '650');
    await user.click(screen.getByRole('button', { name: 'Check Availability' }));
    expect(await screen.findByText('Unavailable')).toBeInTheDocument();
  });

  // D9: a 121-minute booking request is rejected
  it('D9: A101, 660–781 (121 min) is rejected -> Unavailable', async () => {
    const user = userEvent.setup();
    await selectRoom('A101', user);
    await user.type(screen.getByLabelText('Start (min)'), '660');
    await user.type(screen.getByLabelText('End (min)'), '781');
    await user.click(screen.getByRole('button', { name: 'Check Availability' }));
    expect(await screen.findByText('Unavailable')).toBeInTheDocument();
    // Reason should state the 120-minute rule
    expect(
      screen.getByText('Booking cannot exceed 120 minutes.')
    ).toBeInTheDocument();
  });
});
