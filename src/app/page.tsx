import Image from 'next/image';
import Link from 'next/link';
import { Download, ExternalLink, Github, Linkedin, Mail } from 'lucide-react';
import { FeaturedProject } from '@/components/FeaturedProject';
import { PageHeader } from '@/components/PageHeader';
import { projects } from '@/lib/projects';
import { siteConfig } from '@/lib/config';

export default function Home() {
  const featuredProjects = projects.filter((project) => project.kind === 'independent');
  const coursework = projects.filter((project) => project.kind === 'coursework');

  return (
    <div>
      <section>
        <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_15rem] md:gap-16 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="max-w-3xl">
            <PageHeader
              eyebrow="Software engineer · Vancouver, BC"
              title="Hey, I'm Jace."
              description={
                <>
                  <p>
                    I am a full-stack software engineer focusing on data-driven products, built with
                    Next.js, Python, Postgres, and Supabase.
                  </p>
                  <p>
                    Got my Bachelor&apos;s degree in Computer Science at UCLA in 2026. Currently
                    pursuing my Master&apos;s degree in Computer Science at Northeastern University
                    in Vancouver, set to graduate in 2028.
                  </p>
                  <p>Looking for Summer 2027 Software Engineering Co-ops.</p>
                </>
              }
            />

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="/jace-kasen-resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-accent text-background hover:bg-foreground inline-flex items-center gap-2 rounded-sm px-5 py-3 font-mono text-sm transition-colors"
              >
                Résumé <Download size={16} />
              </a>
              <a
                href={siteConfig.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border hover:border-accent hover:text-accent inline-flex items-center gap-2 rounded-sm border px-5 py-3 font-mono text-sm transition-colors"
              >
                LinkedIn <Linkedin size={16} />
              </a>
              <a
                href={siteConfig.socials.email}
                className="text-accent inline-flex items-center gap-2 px-2 py-3 font-mono text-sm font-bold hover:underline"
              >
                Email me <Mail size={16} />
              </a>
            </div>
          </div>

          <div className="relative mx-auto aspect-[4/5] w-56 md:mt-8 md:w-full">
            <div className="border-accent-light/50 absolute -right-3 -bottom-3 h-full w-full border" />
            <Image
              src="/profile_pic.jpg"
              alt="Portrait of Jace Kasen"
              fill
              sizes="(min-width: 1024px) 18rem, (min-width: 768px) 15rem, 14rem"
              className="object-cover object-center"
              priority
            />
          </div>
        </div>
      </section>

      <section id="work" className="mt-12 scroll-mt-24 md:mt-16">
        <div className="border-border/80 mb-8 flex items-end justify-between gap-6 border-b pb-4">
          <div>
            <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">
              Built for curiosity
            </p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Selected work</h2>
          </div>
          <p className="text-muted hidden max-w-none text-right text-sm leading-6 whitespace-nowrap md:block">
            Three personal projects developed into complete, interactive products.
          </p>
        </div>

        <div className="space-y-5 md:space-y-6">
          {featuredProjects.map((project) => (
            <FeaturedProject
              key={project.title}
              project={project}
              headingId={`home-${project.title.toLowerCase().replace(/\s+/g, '-')}`}
              compact
            />
          ))}
        </div>
      </section>

      <section className="mt-12 md:mt-16">
        <div className="border-border/80 mb-7 flex items-end justify-between border-b pb-4">
          <div>
            <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">
              Coursework
            </p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Selected coursework</h2>
          </div>
          <Link href="/work" className="text-accent font-mono text-sm hover:underline">
            All work →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {coursework.map((project) => (
            <article key={project.title} className="bg-surface flex flex-col p-6">
              <p className="text-accent mb-3 font-mono text-[0.68rem] tracking-[0.14em] uppercase">
                {project.eyebrow}
              </p>
              <h3 className="mb-3 text-xl font-bold">{project.title}</h3>
              <p className="text-muted mb-5 text-sm leading-6">{project.description}</p>
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

      <section className="on-ink bg-ink text-on-ink mt-12 grid gap-8 p-7 md:mt-16 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-10">
        <div>
          <p className="text-accent mb-3 font-mono text-xs tracking-[0.16em] uppercase">
            Opportunities
          </p>
          <h2 className="mb-4 max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
            I&apos;m looking for what&apos;s next.
          </h2>
          <p className="text-on-ink-muted max-w-2xl text-lg leading-7">
            I&apos;m looking for Summer 2027 Software Engineering Co-ops with a thoughtful team and
            room to learn.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 md:justify-end">
          <a
            href={siteConfig.socials.email}
            className="bg-accent text-background hover:bg-foreground inline-flex items-center gap-2 rounded-sm px-5 py-3 font-mono text-sm font-bold transition-colors"
          >
            Send me an email <Mail size={16} />
          </a>
          <a
            href={siteConfig.socials.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="border-border hover:border-accent hover:text-accent inline-flex items-center gap-2 rounded-sm border px-5 py-3 font-mono text-sm transition-colors"
          >
            LinkedIn <Linkedin size={16} />
          </a>
        </div>
      </section>
    </div>
  );
}
