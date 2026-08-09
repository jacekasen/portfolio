import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayerAutocomplete } from './PlayerAutocomplete';

const players = ['Stephen Curry', 'Stephon Castle', 'Isaiah Stewart'];

describe('PlayerAutocomplete', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => players,
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function typeQuery(query: string) {
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: query } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(180);
    });

    return input;
  }

  it('shows the remaining text from the first prefix match inline', async () => {
    render(<PlayerAutocomplete inputId="player" defaultValue="" />);

    await typeQuery('Ste');

    expect(screen.getByTestId('inline-player-suggestion')).toHaveTextContent('Stephen Curry');
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-autocomplete', 'both');
  });

  it('accepts the inline suggestion with Tab', async () => {
    render(<PlayerAutocomplete inputId="player" defaultValue="" />);
    const input = await typeQuery('Ste');

    fireEvent.keyDown(input, { key: 'Tab' });

    expect(input).toHaveValue('Stephen Curry');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('accepts the inline suggestion with ArrowRight when the caret is at the end', async () => {
    render(<PlayerAutocomplete inputId="player" defaultValue="" />);
    const input = (await typeQuery('Ste')) as HTMLInputElement;
    input.setSelectionRange(3, 3);

    fireEvent.keyDown(input, { key: 'ArrowRight' });

    expect(input).toHaveValue('Stephen Curry');
  });
});
