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
    expect(screen.getByRole('link', { name: /projects/i })).toBeInTheDocument();
  });

  it('expands sidebar when toggle is clicked', () => {
    render(
      <Shell>
        <div>Content</div>
      </Shell>,
    );

    const logo = screen.getByText('jk');
    expect(logo).toHaveClass('opacity-0');

    fireEvent.click(screen.getByTestId('mobile-menu-toggle'));

    expect(logo).toHaveClass('opacity-100');
  });

  it('collapses sidebar when toggle is clicked again', () => {
    render(
      <Shell>
        <div>Content</div>
      </Shell>,
    );

    fireEvent.click(screen.getByTestId('mobile-menu-toggle'));
    const logo = screen.getByText('jk');
    expect(logo).toHaveClass('opacity-100');

    fireEvent.click(screen.getByTestId('sidebar-toggle'));
    expect(logo).toHaveClass('opacity-0');
  });
});
