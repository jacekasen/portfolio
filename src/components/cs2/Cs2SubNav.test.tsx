import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Cs2SubNav } from './Cs2SubNav';

let mockPathname = '/projects/cs2/trends';
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

describe('Cs2SubNav Component', () => {
  beforeEach(() => {
    mockPathname = '/projects/cs2/trends';
  });

  it('renders links to all three CS2 analysis pages with player query params', () => {
    render(<Cs2SubNav player="m0NESY" />);

    const trendsLink = screen.getByRole('link', { name: /Map-to-Map Trends/i });
    const formLink = screen.getByRole('link', { name: /Form Tracker/i });
    const radarLink = screen.getByRole('link', { name: /Radar Duel Heatmap/i });

    expect(trendsLink).toHaveAttribute('href', '/projects/cs2/trends?player=m0NESY');
    expect(formLink).toHaveAttribute('href', '/projects/cs2/form?player=m0NESY');
    expect(radarLink).toHaveAttribute('href', '/projects/cs2/radar?player=m0NESY');
  });

  it('highlights Map-to-Map Trends when on /projects/cs2/trends', () => {
    mockPathname = '/projects/cs2/trends';
    render(<Cs2SubNav player="donk" />);

    const trendsLink = screen.getByRole('link', { name: /Map-to-Map Trends/i });
    expect(trendsLink.className).toContain('bg-accent');

    const formLink = screen.getByRole('link', { name: /Form Tracker/i });
    expect(formLink.className).not.toContain('bg-accent');
  });

  it('highlights Form Tracker when on /projects/cs2/form', () => {
    mockPathname = '/projects/cs2/form';
    render(<Cs2SubNav player="donk" />);

    const formLink = screen.getByRole('link', { name: /Form Tracker/i });
    expect(formLink.className).toContain('bg-accent');

    const trendsLink = screen.getByRole('link', { name: /Map-to-Map Trends/i });
    expect(trendsLink.className).not.toContain('bg-accent');
  });

  it('highlights Radar Duel Heatmap when on /projects/cs2/radar', () => {
    mockPathname = '/projects/cs2/radar';
    render(<Cs2SubNav player="donk" />);

    const radarLink = screen.getByRole('link', { name: /Radar Duel Heatmap/i });
    expect(radarLink.className).toContain('bg-accent');

    const trendsLink = screen.getByRole('link', { name: /Map-to-Map Trends/i });
    expect(trendsLink.className).not.toContain('bg-accent');
  });
});
