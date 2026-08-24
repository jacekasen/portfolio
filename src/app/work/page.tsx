import Link from 'next/link';
import { ExternalLink, Github } from 'lucide-react';
import { FeaturedProject } from '@/components/FeaturedProject';
import { projects } from '@/lib/projects';

export const metadata = {
  title: 'Work',
  description:
    'A flight diary and an NBA analysis site Jace keeps working on, plus a few things he made at UCLA.',
};

export default function Work() {
  const featured = projects.filter((project) => project.kind === 'independent');
  const coursework = projects.filter((project) => project.kind === 'coursework');

  return (
    <div className="space-y-16 md:space-y-20">
      <header className="pt-4 md:pt-8">
        <p className="text-accent mb-3 font-mono text-xs tracking-[0.16em] uppercase">Work</p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          Things I&apos;ve built
        </h1>
        <p className="text-muted max-w-2xl text-lg leading-8">
          The NBA site and the flight tracker are projects I started for myself and keep coming back
          to. The other projects were completed as coursework at UCLA.
        </p>
      </header>

      <section aria-labelledby="featured-heading" className="space-y-8 md:space-y-10">
        <h2 id="featured-heading" className="sr-only">
          Featured projects
        </h2>
        {featured.map((project) => (
          <FeaturedProject
            key={project.title}
            project={project}
            headingId={`featured-${project.title.toLowerCase().replace(/\s+/g, '-')}`}
          />
        ))}
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
