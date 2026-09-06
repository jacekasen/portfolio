import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: ReactNode;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="max-w-4xl pt-4 md:pt-8">
      <p className="text-accent mb-3 font-mono text-xs tracking-[0.16em] uppercase">{eyebrow}</p>
      <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
      {description && <p className="text-muted max-w-3xl text-lg leading-8">{description}</p>}
    </header>
  );
}
