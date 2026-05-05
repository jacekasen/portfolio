'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, User, Code, Menu, ChevronLeft, Github, Linkedin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/lib/config';

export default function Shell({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'About', href: '/about', icon: User },
    { name: 'Blog', href: '/blog', icon: BookOpen },
    { name: 'Projects', href: '/projects', icon: Code },
  ];

  return (
    <div className="bg-background min-h-screen">
      {!isExpanded && (
        <button
          data-testid="mobile-menu-toggle"
          className="bg-surface border-border fixed top-4 left-4 z-50 rounded-md border p-2 md:hidden"
          onClick={() => setIsExpanded(true)}
        >
          <Menu size={24} className="text-accent" />
        </button>
      )}

      <aside
        onClick={!isExpanded ? () => setIsExpanded(true) : undefined}
        className={cn(
          'bg-surface border-border fixed top-0 left-0 z-40 flex h-screen flex-col border-r transition-all duration-300 ease-in-out',
          isExpanded ? 'w-64 translate-x-0' : '-translate-x-full md:w-14 md:translate-x-0 md:cursor-e-resize',
        )}
      >
        <div
          className={cn(
            'border-border flex h-16 items-center border-b px-4',
            isExpanded ? 'justify-between' : 'justify-center',
          )}
        >
          <span
            className={cn(
              'text-accent overflow-hidden font-mono text-2xl font-bold tracking-tight whitespace-nowrap transition-all duration-300',
              !isExpanded ? 'w-0 opacity-0' : 'w-auto opacity-100',
            )}
          >
            jk
          </span>
          <button
            data-testid="sidebar-toggle"
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className={cn(
              'hover:bg-accent-light/30 text-accent rounded-md p-2',
              isExpanded ? 'flex' : 'hidden md:flex',
            )}
          >
            {isExpanded ? <ChevronLeft size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-2 px-3 py-6 font-mono">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'flex items-center overflow-hidden rounded-lg p-3 text-sm whitespace-nowrap transition-colors',
                  isExpanded ? 'gap-4' : 'justify-center',
                  isActive
                    ? 'bg-accent-light/40 text-accent'
                    : 'hover:bg-accent-light/20 text-foreground',
                )}
                title={!isExpanded ? item.name : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                <span
                  className={cn(
                    'transition-all duration-300',
                    !isExpanded
                      ? 'w-0 translate-x-10 opacity-0'
                      : 'w-auto translate-x-0 opacity-100',
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-border border-t p-4">
          <div
            className={cn(
              'flex justify-center gap-4 transition-all duration-300',
              !isExpanded ? 'flex-col items-center' : '',
            )}
          >
            <a
              href={siteConfig.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted hover:text-accent transition-colors"
            >
              <Github size={20} />
            </a>
            <a
              href={siteConfig.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted hover:text-accent transition-colors"
            >
              <Linkedin size={20} />
            </a>
          </div>
        </div>
      </aside>

      <main
        className={cn(
          'min-h-screen transition-all duration-300 ease-in-out',
          isExpanded ? 'md:ml-64' : 'md:ml-14',
        )}
      >
        <div className="mx-auto max-w-5xl px-4 pt-16 pb-4 md:p-8 md:px-12 lg:px-16">{children}</div>
      </main>

      {isExpanded && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}
