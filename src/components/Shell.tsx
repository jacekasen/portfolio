'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, User, Code, Menu, X, Github, Linkedin, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/lib/config';

export default function Shell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'About', href: '/about', icon: User },
    { name: 'Blog', href: '/blog', icon: BookOpen },
    { name: 'Projects', href: '/projects', icon: Code },
  ];

  const isActiveHref = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));

  const year = new Date().getFullYear();

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="bg-surface/90 border-border/80 fixed top-0 left-0 z-40 w-full border-b backdrop-blur-sm">
        <div className="relative flex h-16 items-center px-4 md:px-8 lg:px-12">
          <Link
            href="/"
            className="text-accent font-mono text-xl font-bold tracking-tight md:text-2xl"
            onClick={() => setMenuOpen(false)}
          >
            jk
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 font-mono text-sm md:flex">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-2 transition-colors',
                  isActiveHref(item.href)
                    ? 'bg-accent-light/25 text-accent'
                    : 'hover:bg-accent-light/15 text-foreground',
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
          <div data-testid="mobile-menu" className="bg-surface border-border/80 border-t md:hidden">
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
                        ? 'bg-accent-light/25 text-accent'
                        : 'hover:bg-accent-light/15 text-foreground',
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
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-12 md:py-12 lg:px-16">{children}</div>
      </main>

      <footer className="border-border/80 border-t">
        <div className="text-muted mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-4 md:flex-row md:justify-between md:px-12 lg:px-16">
          <p className="font-mono text-xs">
            © {year} {siteConfig.name}
          </p>
          <div className="flex items-center gap-4">
            <a
              href={siteConfig.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-accent"
            >
              <Github size={15} />
            </a>
            <a
              href={siteConfig.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-accent"
            >
              <Linkedin size={15} />
            </a>
            <a href={siteConfig.socials.email} className="transition-colors hover:text-accent">
              <Mail size={15} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
