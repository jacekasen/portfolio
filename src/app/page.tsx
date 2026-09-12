import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Download, Linkedin, Mail } from 'lucide-react';
import { FeaturedProject } from '@/components/FeaturedProject';
import { PageHeader } from '@/components/PageHeader';
import { projects } from '@/lib/projects';
import { siteConfig } from '@/lib/config';

export default function Home() {
  const featuredProjects = projects.filter((project) => project.kind === 'independent');
  const coursework = projects.filter((project) => project.kind === 'coursework');

  return (
    <div className="pb-8">
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

      <section className="mt-16 md:mt-24">
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

        <div className="divide-border divide-y">
          {coursework.map((project, index) => {
            const href = project.demo ?? project.github ?? '/work';
            const isExternal = !project.demo && Boolean(project.github);
            const rowClassName =
              'group hover:bg-surface -mx-3 grid gap-2 px-3 py-5 transition-colors sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-5';
            const content = (
              <>
                <span className="text-accent font-mono text-xs font-bold">0{index + 1}</span>
                <span>
                  <span className="group-hover:text-accent block text-lg font-bold transition-colors">
                    {project.title}
                  </span>
                  <span className="text-muted mt-1 hidden max-w-2xl text-sm leading-6 sm:block">
                    {project.description}
                  </span>
                </span>
                <ArrowRight
                  className="text-accent hidden transition-transform group-hover:translate-x-1 sm:block"
                  size={17}
                />
              </>
            );

            return isExternal ? (
              <a
                key={project.title}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={rowClassName}
              >
                {content}
              </a>
            ) : (
              <Link key={project.title} href={href} className={rowClassName}>
                {content}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="on-ink bg-ink text-on-ink mt-16 grid gap-8 p-7 md:mt-24 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-10">
        <div>
          <p className="text-accent mb-3 font-mono text-xs tracking-[0.16em] uppercase">
            Opportunities
          </p>
          <h2 className="mb-4 max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
            I&apos;m looking for what&apos;s next.
          </h2>
          <p className="text-on-ink-muted max-w-2xl text-lg leading-7">
            I&apos;m looking for Summer 2027 software engineering Co-ops with a thoughtful team and
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
