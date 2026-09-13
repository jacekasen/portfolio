import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Cs2RadarPlayerSearch, POPULAR_PLAYERS } from './Cs2RadarPlayerSearch';
import type { RadarManifest } from '@/lib/cs2/radar';

const mockManifest: RadarManifest = {
  version: '1.0',
  generatedAt: '2026-09-13',
  allMaps: ['mirage', 'inferno', 'nuke'],
  weaponCategories: { rifles: ['ak47', 'm4a1_silencer'] },
  players: [
    {
      player: 'donk',
      team: 'Team Spirit',
      role: 'Rifler (Entry)',
      country: 'RU',
      totalKills: 2517,
      totalDeaths: 1536,
      headshotPct: 65.2,
      avgDistanceMeters: 14.2,
      openingDuelWinPct: 62.1,
      maps: ['mirage', 'inferno'],
    },
    {
      player: 'm0NESY',
      team: 'G2 Esports',
      role: 'AWPer (Sniper)',
      country: 'RU',
      totalKills: 2602,
      totalDeaths: 1567,
      headshotPct: 41.3,
      avgDistanceMeters: 21.0,
      openingDuelWinPct: 64.5,
      maps: ['mirage', 'inferno', 'nuke'],
    },
    {
      player: 'ZywOo',
      team: 'Team Vitality',
      role: 'AWPer / Hybrid',
      country: 'FR',
      totalKills: 2812,
      totalDeaths: 1646,
      headshotPct: 44.8,
      avgDistanceMeters: 18.3,
      openingDuelWinPct: 66.2,
      maps: ['mirage', 'nuke'],
    },
    {
      player: 'NiKo',
      team: 'G2 Esports',
      role: 'Rifler (Aggressive)',
      country: 'BA',
      totalKills: 2639,
      totalDeaths: 1612,
      headshotPct: 58.1,
      avgDistanceMeters: 15.6,
      openingDuelWinPct: 59.8,
      maps: ['mirage', 'inferno'],
    },
    {
      player: 'b1t',
      team: 'Natus Vincere',
      role: 'Rifler (Headshot Anchor)',
      country: 'UA',
      totalKills: 2364,
      totalDeaths: 1452,
      headshotPct: 68.4,
      avgDistanceMeters: 15.1,
      openingDuelWinPct: 56.4,
      maps: ['mirage'],
    },
    {
      player: 'sh1ro',
      team: 'Team Spirit',
      role: 'AWPer (Sniper)',
      country: 'RU',
      totalKills: 2203,
      totalDeaths: 1354,
      headshotPct: 32.5,
      avgDistanceMeters: 19.8,
      openingDuelWinPct: 63.2,
      maps: ['mirage', 'inferno'],
    },
    {
      player: 'molodoy',
      team: 'FURIA',
      role: 'AWPer (Sniper)',
      country: 'KZ',
      totalKills: 2476,
      totalDeaths: 1548,
      headshotPct: 38.1,
      avgDistanceMeters: 18.5,
      openingDuelWinPct: 58.7,
      maps: ['mirage', 'inferno'],
    },
  ],
};

describe('Cs2RadarPlayerSearch Component', () => {
  it('renders popular players bar and highlights the active player', () => {
    const handleSelect = vi.fn();
    render(
      <Cs2RadarPlayerSearch
        manifest={mockManifest}
        selectedPlayer="donk"
        onSelectPlayer={handleSelect}
      />,
    );

    const popularNav = screen.getByRole('navigation', { name: /popular players/i });
    expect(popularNav).toBeInTheDocument();

    // Check that 'donk' is highlighted with active styling
    const donkButton = screen.getByRole('button', { name: /^donk$/i });
    expect(donkButton).toHaveAttribute('aria-current', 'page');
    expect(donkButton.className).toContain('bg-accent');

    // Check that m0NESY is present but not current
    const m0nesyButton = screen.getByRole('button', { name: /^m0NESY$/i });
    expect(m0nesyButton).not.toHaveAttribute('aria-current', 'page');
  });

  it('clicking a popular player pill triggers onSelectPlayer', () => {
    const handleSelect = vi.fn();
    render(
      <Cs2RadarPlayerSearch
        manifest={mockManifest}
        selectedPlayer="donk"
        onSelectPlayer={handleSelect}
      />,
    );

    const m0nesyButton = screen.getByRole('button', { name: /^m0NESY$/i });
    fireEvent.click(m0nesyButton);

    expect(handleSelect).toHaveBeenCalledWith('m0NESY');
  });

  it('shows inline ghost-text suggestion when typing prefix', () => {
    const handleSelect = vi.fn();
    render(
      <Cs2RadarPlayerSearch
        manifest={mockManifest}
        selectedPlayer=""
        onSelectPlayer={handleSelect}
      />,
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'zy' } });

    const inlineSuggestion = screen.getByTestId('inline-player-suggestion');
    expect(inlineSuggestion).toHaveTextContent('ZywOo');
  });

  it('accepts inline suggestion with Tab key', () => {
    const handleSelect = vi.fn();
    render(
      <Cs2RadarPlayerSearch
        manifest={mockManifest}
        selectedPlayer=""
        onSelectPlayer={handleSelect}
      />,
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'zy' } });
    fireEvent.keyDown(input, { key: 'Tab' });

    expect(handleSelect).toHaveBeenCalledWith('ZywOo');
    expect(input).toHaveValue('ZywOo');
  });

  it('navigates dropdown options using arrow keys and Enter', () => {
    const handleSelect = vi.fn();
    render(
      <Cs2RadarPlayerSearch
        manifest={mockManifest}
        selectedPlayer=""
        onSelectPlayer={handleSelect}
      />,
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'n' } });

    // Press ArrowDown to open/focus first item (NiKo)
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleSelect).toHaveBeenCalledWith('NiKo');
  });

  it('submitting form with typed query triggers onSelectPlayer', () => {
    const handleSelect = vi.fn();
    render(
      <Cs2RadarPlayerSearch
        manifest={mockManifest}
        selectedPlayer=""
        onSelectPlayer={handleSelect}
      />,
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'b1t' } });

    const submitBtn = screen.getByRole('button', { name: /inspect player/i });
    fireEvent.click(submitBtn);

    expect(handleSelect).toHaveBeenCalledWith('b1t');
  });

  it('matches the exact requested popular players list', () => {
    expect(POPULAR_PLAYERS).toEqual([
      'donk',
      'ZywOo',
      'm0NESY',
      'NiKo',
      'ropz',
      'sh1ro',
      'molodoy',
      'frozen',
      'XANTARES',
      'Twistzz',
    ]);
  });

  it('resolves common alias spellings like monesy -> m0NESY and shiro -> sh1ro', () => {
    const handleSelect = vi.fn();
    render(
      <Cs2RadarPlayerSearch
        manifest={mockManifest}
        selectedPlayer=""
        onSelectPlayer={handleSelect}
      />,
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'monesy' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleSelect).toHaveBeenCalledWith('m0NESY');

    fireEvent.change(input, { target: { value: 'shiro' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleSelect).toHaveBeenCalledWith('sh1ro');
  });

  it('renders sh1ro and molodoy popular player pills and handles clicks', () => {
    const handleSelect = vi.fn();
    render(
      <Cs2RadarPlayerSearch
        manifest={mockManifest}
        selectedPlayer="donk"
        onSelectPlayer={handleSelect}
      />,
    );

    const sh1roBtn = screen.getByRole('button', { name: /^sh1ro$/i });
    expect(sh1roBtn).toBeInTheDocument();
    fireEvent.click(sh1roBtn);
    expect(handleSelect).toHaveBeenCalledWith('sh1ro');

    const molodoyBtn = screen.getByRole('button', { name: /^molodoy$/i });
    expect(molodoyBtn).toBeInTheDocument();
    fireEvent.click(molodoyBtn);
    expect(handleSelect).toHaveBeenCalledWith('molodoy');
  });
});

