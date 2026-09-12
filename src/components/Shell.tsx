'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  BriefcaseBusiness,
  Crosshair,
  Download,
  Github,
  Linkedin,
  Mail,
  Menu,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/lib/config';

export default function Shell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: 'Work', href: '/work', icon: BriefcaseBusiness },
    { name: 'About', href: '/about', icon: User },
    { name: 'Writing', href: '/blog', icon: BookOpen },
    { name: 'NBA Analysis', href: '/projects/nba', icon: TrendingUp },
    { name: 'CS2 Analysis', href: '/projects/cs2', icon: Crosshair },
    { name: 'Résumé', href: '/jace-kasen-resume.pdf', icon: Download },
  ];

  const activeHref = navItems
    .filter(
      ({ href }) =>
        !href.includes('#') &&
        !href.endsWith('.pdf') &&
        (pathname === href || pathname.startsWith(`${href}/`)),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const isActiveHref = (href: string) => href === activeHref;

  const year = new Date().getFullYear();

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="on-ink bg-ink text-on-ink fixed top-0 left-0 z-40 w-full">
        <div className="relative flex h-16 items-center px-4 md:justify-center md:px-8 lg:px-12">
          <Link
            href="/"
            className="text-accent font-mono text-xl font-bold tracking-tight md:text-2xl"
            onClick={() => setMenuOpen(false)}
          >
            jk
          </Link>

          <nav className="ml-4 hidden items-center gap-1 font-mono text-sm md:flex">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-2 transition-colors',
                  isActiveHref(item.href)
                    ? 'bg-accent text-background font-bold'
                    : 'text-on-ink-muted hover:text-on-ink hover:bg-black/5',
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <button
            data-testid="mobile-menu-toggle"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="text-accent ml-auto md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <div data-testid="mobile-menu" className="bg-ink md:hidden">
            <nav className="flex flex-col gap-1 p-4 font-mono text-sm">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-md p-3 transition-colors',
                      isActiveHref(item.href)
                        ? 'bg-accent text-background font-bold'
                        : 'text-on-ink-muted hover:text-on-ink hover:bg-black/5',
                    )}
                  >
                    <Icon size={20} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 pt-16">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-12 md:py-12 lg:px-16">{children}</div>
      </main>

      <footer className="on-ink bg-ink text-on-ink-muted mt-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 md:flex-row md:justify-between md:px-12 lg:px-16">
          <p className="font-mono text-xs">
            © {year} {siteConfig.name}
          </p>
          <div className="flex items-center gap-5">
            <a
              href={siteConfig.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              <Github size={17} />
              <span className="sr-only">GitHub</span>
            </a>
            <a
              href={siteConfig.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              <Linkedin size={17} />
              <span className="sr-only">LinkedIn</span>
            </a>
            <a href={siteConfig.socials.email} className="hover:text-accent transition-colors">
              <Mail size={17} />
              <span className="sr-only">Email</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
