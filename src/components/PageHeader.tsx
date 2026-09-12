import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  compact?: boolean;
}

export function PageHeader({ eyebrow, title, description, compact = false }: PageHeaderProps) {
  return (
    <header className="w-full">
      <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">{eyebrow}</p>
      <h1
        className={`font-bold tracking-tight ${compact ? 'mb-2 text-3xl md:text-4xl' : 'mb-4 text-4xl md:text-5xl'}`}
      >
        {title}
      </h1>
      {description && (
        <div
          className={`text-muted w-full max-w-none space-y-3 ${compact ? 'text-sm leading-5 md:text-base md:leading-6' : 'text-lg leading-8'}`}
        >
          {description}
        </div>
      )}
    </header>
  );
}
