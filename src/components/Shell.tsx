"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  BookOpen, 
  User, 
  Code, 
  Menu, 
  ChevronLeft,
  Github,
  Linkedin
} from 'lucide-react';
import { clsx } from 'clsx';

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
    <div className="min-h-screen bg-background">
      {/* Mobile Toggle Button (visible only when sidebar is closed on mobile) */}
      {!isExpanded && (
        <button
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-surface border border-border md:hidden"
          onClick={() => setIsExpanded(true)}
        >
          <Menu size={24} className="text-accent" />
        </button>
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          "fixed top-0 left-0 h-screen bg-surface border-r border-border transition-all duration-300 ease-in-out z-40 flex flex-col",
          isExpanded ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0 md:w-20"
        )}
      >
        {/* Header / Toggle */}
        <div className={clsx("h-16 flex items-center px-4 border-b border-border", isExpanded ? "justify-between" : "justify-center")}>
            <span className={clsx("font-mono font-bold text-2xl overflow-hidden whitespace-nowrap transition-all duration-300 text-accent tracking-tight", 
              !isExpanded ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>
              jk
            </span>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className={clsx(
                "p-2 rounded-md hover:bg-accent-light/30 text-accent",
                isExpanded ? "flex" : "hidden md:flex"
              )}
            >
              {isExpanded ? <ChevronLeft size={24} /> : <Menu size={24} />}
            </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 flex flex-col gap-2 px-3 font-mono">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex items-center p-3 rounded-lg transition-colors overflow-hidden whitespace-nowrap text-sm",
                  isExpanded ? "gap-4" : "justify-center",
                  isActive 
                    ? "bg-accent-light/40 text-accent" 
                    : "hover:bg-accent-light/20 text-foreground"
                )}
                title={!isExpanded ? item.name : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                <span className={clsx("transition-all duration-300", !isExpanded ? "opacity-0 w-0 translate-x-10" : "opacity-100 w-auto translate-x-0")}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / Socials */}
        <div className="p-4 border-t border-border">
           <div className={clsx("flex gap-4 justify-center transition-all duration-300", !isExpanded ? "flex-col items-center" : "")}>
              <a href="https://github.com/jacekasen" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent transition-colors">
                <Github size={20} />
              </a>
              <a href="https://linkedin.com/in/jacekasen" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent transition-colors">
                <Linkedin size={20} />
              </a>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main 
        className={clsx(
          "transition-all duration-300 ease-in-out min-h-screen",
          isExpanded ? "md:ml-64" : "md:ml-20"
        )}
      >
        <div className="pt-16 px-4 pb-4 md:p-8 md:px-12 lg:px-16 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
      
      {/* Overlay for mobile when menu is open */}
      {isExpanded && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}
