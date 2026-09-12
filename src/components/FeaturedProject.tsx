import Link from 'next/link';
import { ArrowRight, ExternalLink, Github } from 'lucide-react';
import type { Project } from '@/lib/projects';
import { cn } from '@/lib/utils';

interface FeaturedProjectProps {
  project: Project;
  headingId: string;
  compact?: boolean;
}

export function FeaturedProject({ project, headingId, compact = false }: FeaturedProjectProps) {
  const highlights = compact ? project.highlights?.slice(0, 2) : project.highlights;
  const tags = compact ? project.tags.slice(0, 4) : project.tags;

  return (
    <article
      className={cn(
        'on-ink bg-ink text-on-ink grid md:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)]',
        compact ? 'gap-5 p-5 md:p-6' : 'gap-9 p-7 md:p-10',
      )}
    >
      <div>
        <p className="text-accent mb-3 font-mono text-xs tracking-[0.16em] uppercase">
          {project.eyebrow}
        </p>
        <h3
          id={headingId}
          className={cn(
            'leading-tight font-bold',
            compact ? 'mb-4 text-xl md:text-2xl' : 'mb-5 text-3xl md:text-4xl',
          )}
        >
          {project.title}
        </h3>
        <p
          className={cn(
            'max-w-2xl',
            compact ? 'mb-5 line-clamp-2 leading-7' : 'mb-5 text-lg leading-8',
          )}
        >
          {project.description}
        </p>
        {!compact && (
          <p className="text-on-ink-muted mb-7 max-w-2xl leading-7">{project.buildDetails}</p>
        )}
        <div
          className={cn('flex flex-wrap gap-2 font-mono text-[0.68rem]', compact ? 'mb-6' : 'mb-8')}
        >
          {tags.map((tag) => (
            <span key={tag} className="bg-background/70 rounded-sm px-2.5 py-1.5">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {project.demo && (
            <Link
              href={project.demo}
              className="bg-accent text-background hover:bg-foreground inline-flex items-center gap-2 rounded-sm px-5 py-3 font-mono text-sm transition-colors"
            >
              Open the project <ArrowRight size={16} />
            </Link>
          )}
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border hover:border-accent hover:text-accent inline-flex items-center gap-2 rounded-sm border px-5 py-3 font-mono text-sm transition-colors"
            >
              <Github size={16} /> Source
            </a>
          )}
          {project.video && (
            <a
              href={project.video}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border hover:border-accent hover:text-accent inline-flex items-center gap-2 rounded-sm border px-5 py-3 font-mono text-sm transition-colors"
            >
              Watch demo <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>

      {highlights && (
        <div
          className={cn(
            'border-border border-t md:border-t-0 md:border-l md:pt-0',
            compact ? 'pt-5 md:pl-6' : 'pt-7 md:pl-8',
          )}
        >
          <p className="text-accent mb-5 font-mono text-xs tracking-[0.16em] uppercase">
            {compact ? 'Highlights' : 'What it includes'}
          </p>
          <ul className={compact ? 'space-y-2' : 'space-y-4'}>
            {highlights.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6">
                <span className="text-accent font-mono">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
