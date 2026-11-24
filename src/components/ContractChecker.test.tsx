import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContractChecker from './ContractChecker';

describe('ContractChecker UI', () => {
  beforeEach(() => {
    render(<ContractChecker />);
  });

  it('T1 through the form: 13:30/60/open shows the AVAILABLE message', async () => {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/start time/i), '13:30');
    await user.type(screen.getByLabelText(/duration/i), '60');
    await user.click(screen.getByRole('button', { name: 'Check A101' }));
    expect(
      screen.getByText('Available: A101 is free from 13:30 to 14:30.')
    ).toBeInTheDocument();
    expect(screen.getByText(/AVAILABLE/)).toBeInTheDocument();
  });

  it('T3 through the form: blocked room shows the BLOCKED message', async () => {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/start time/i), '13:30');
    await user.type(screen.getByLabelText(/duration/i), '60');
    await user.click(screen.getByLabelText(/blocked for maintenance/i));
    await user.click(screen.getByRole('button', { name: 'Check A101' }));
    expect(
      screen.getByText('Unavailable: A101 is blocked for maintenance.')
    ).toBeInTheDocument();
    expect(screen.getByText(/BLOCKED/)).toBeInTheDocument();
  });

  it('T4 through the form: duration 0 shows the INVALID_DURATION message', async () => {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/start time/i), '13:30');
    await user.type(screen.getByLabelText(/duration/i), '0');
    await user.click(screen.getByRole('button', { name: 'Check A101' }));
    expect(
      screen.getByText(
        'Invalid input: duration must be a whole number from 1 to 120 minutes.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/INVALID_DURATION/)).toBeInTheDocument();
  });

  it('shows the two A101 bookings read-only and a status box after checking', async () => {
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/start time/i), '13:30');
    await user.type(screen.getByLabelText(/duration/i), '60');
    await user.click(screen.getByRole('button', { name: 'Check A101' }));
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/10:00-11:00/)).toBeInTheDocument();
    expect(screen.getByText(/12:00-13:00/)).toBeInTheDocument();
  });

  it('checkbox is a room status control that toggles on and off', async () => {
    const user = userEvent.setup();
    const checkbox = screen.getByLabelText(/blocked for maintenance/i);
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('fires a submit event (form)', () => {
    const form = screen.getByRole('button', { name: 'Check A101' }).closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
    expect(
      screen.getByText('Invalid input: enter the start time as HH:MM.')
    ).toBeInTheDocument();
  });
});
