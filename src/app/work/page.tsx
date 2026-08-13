import Link from 'next/link';
import { ArrowRight, ExternalLink, Github } from 'lucide-react';
import { projects } from '@/lib/projects';

export const metadata = {
  title: 'Work',
  description: 'The NBA site Jace keeps working on, plus a few things he made at UCLA.',
};

const nbaBuild = [
  'Player search and dynamic routes',
  'Server-backed PostgreSQL queries',
  'Interactive career and peak dashboards',
  'Prediction and comparison features',
];

export default function Work() {
  const nbaProject = projects.find((project) => project.kind === 'independent');
  const coursework = projects.filter((project) => project.kind === 'coursework');

  if (!nbaProject) return null;

  return (
    <div className="space-y-16 md:space-y-20">
      <header className="pt-4 md:pt-8">
        <p className="text-accent mb-3 font-mono text-xs tracking-[0.16em] uppercase">Work</p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          Things I&apos;ve built
        </h1>
        <p className="text-muted max-w-2xl text-lg leading-8">
          The NBA site is a project I started for fun and keep coming back to. The other projects
          were completed as coursework at UCLA.
        </p>
      </header>

      <section aria-labelledby="featured-project">
        <article className="on-ink bg-ink text-on-ink grid gap-9 p-7 md:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)] md:p-10">
          <div>
            <p className="text-accent mb-3 font-mono text-xs tracking-[0.16em] uppercase">
              {nbaProject.eyebrow}
            </p>
            <h2 id="featured-project" className="mb-5 text-3xl leading-tight font-bold md:text-4xl">
              {nbaProject.title}
            </h2>
            <p className="mb-5 max-w-2xl text-lg leading-8">{nbaProject.description}</p>
            <p className="text-on-ink-muted mb-7 max-w-2xl leading-7">{nbaProject.buildDetails}</p>
            <div className="mb-8 flex flex-wrap gap-2 font-mono text-[0.68rem]">
              {nbaProject.tags.map((tag) => (
                <span key={tag} className="bg-background/70 rounded-sm px-2.5 py-1.5">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={nbaProject.demo || '/projects/nba'}
                className="bg-accent text-background hover:bg-foreground inline-flex items-center gap-2 rounded-sm px-5 py-3 font-mono text-sm transition-colors"
              >
                Open the project <ArrowRight size={16} />
              </Link>
              {nbaProject.github && (
                <a
                  href={nbaProject.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-border hover:border-accent hover:text-accent inline-flex items-center gap-2 rounded-sm border px-5 py-3 font-mono text-sm transition-colors"
                >
                  <Github size={16} /> Source
                </a>
              )}
            </div>
          </div>

          <div className="border-border border-t pt-7 md:border-t-0 md:border-l md:pt-0 md:pl-8">
            <p className="text-accent mb-5 font-mono text-xs tracking-[0.16em] uppercase">
              What is in there
            </p>
            <ul className="space-y-4">
              {nbaBuild.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6">
                  <span className="text-accent font-mono">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      <section aria-labelledby="coursework-heading">
        <div className="border-border/80 mb-8 border-b pb-4">
          <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">
            Coursework
          </p>
          <h2 id="coursework-heading" className="text-3xl font-bold tracking-tight md:text-4xl">
            Coursework projects
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {coursework.map((project) => (
            <article key={project.title} className="bg-surface flex flex-col p-6">
              <p className="text-accent mb-3 font-mono text-[0.68rem] tracking-[0.14em] uppercase">
                {project.eyebrow}
              </p>
              <h3 className="mb-3 text-xl font-bold">{project.title}</h3>
              <p className="text-muted mb-4 text-sm leading-6">{project.description}</p>
              <p className="mb-5 text-sm leading-6">{project.buildDetails}</p>
              <div className="mb-5 flex flex-wrap gap-2 font-mono text-[0.65rem]">
                {project.tags.map((tag) => (
                  <span key={tag} className="bg-accent-light/25 text-accent rounded-sm px-2 py-1">
                    {tag}
                  </span>
                ))}
              </div>
              {(project.demo || project.github) && (
                <div className="mt-auto flex flex-wrap gap-4 pt-2 font-mono text-xs">
                  {project.demo && (
                    <Link
                      href={project.demo}
                      className="text-accent inline-flex items-center gap-1.5 hover:underline"
                    >
                      More detail <ExternalLink size={13} />
                    </Link>
                  )}
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-accent inline-flex items-center gap-1.5"
                    >
                      <Github size={13} /> Source
                    </a>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
