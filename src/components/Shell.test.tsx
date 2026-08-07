import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Shell from './Shell';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

vi.mock('@/lib/config', () => ({
  siteConfig: {
    socials: {
      github: 'https://github.com/test',
      linkedin: 'https://linkedin.com/in/test',
    },
  },
}));

describe('Shell Component', () => {
  it('renders children correctly', () => {
    render(
      <Shell>
        <div data-testid="child-content">Child Content</div>
      </Shell>,
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(
      <Shell>
        <div>Content</div>
      </Shell>,
    );

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /blog/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^projects$/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /nba analysis/i })).toBeInTheDocument();
  });

  it('opens the mobile menu when toggle is clicked', () => {
    render(
      <Shell>
        <div>Content</div>
      </Shell>,
    );

    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('mobile-menu-toggle'));

    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
  });

  it('closes the mobile menu when toggle is clicked again', () => {
    render(
      <Shell>
        <div>Content</div>
      </Shell>,
    );

    fireEvent.click(screen.getByTestId('mobile-menu-toggle'));
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('mobile-menu-toggle'));
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
  });
});
