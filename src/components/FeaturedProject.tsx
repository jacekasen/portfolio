import Link from 'next/link';
import { ArrowRight, Github } from 'lucide-react';
import type { Project } from '@/lib/projects';

interface FeaturedProjectProps {
  project: Project;
  headingId: string;
}

export function FeaturedProject({ project, headingId }: FeaturedProjectProps) {
  return (
    <article className="on-ink bg-ink text-on-ink grid gap-9 p-7 md:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)] md:p-10">
      <div>
        <p className="text-accent mb-3 font-mono text-xs tracking-[0.16em] uppercase">
          {project.eyebrow}
        </p>
        <h3 id={headingId} className="mb-5 text-3xl leading-tight font-bold md:text-4xl">
          {project.title}
        </h3>
        <p className="mb-5 max-w-2xl text-lg leading-8">{project.description}</p>
        <p className="text-on-ink-muted mb-7 max-w-2xl leading-7">{project.buildDetails}</p>
        <div className="mb-8 flex flex-wrap gap-2 font-mono text-[0.68rem]">
          {project.tags.map((tag) => (
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
        </div>
      </div>

      {project.highlights && (
        <div className="border-border border-t pt-7 md:border-t-0 md:border-l md:pt-0 md:pl-8">
          <p className="text-accent mb-5 font-mono text-xs tracking-[0.16em] uppercase">
            What it includes
          </p>
          <ul className="space-y-4">
            {project.highlights.map((item) => (
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
