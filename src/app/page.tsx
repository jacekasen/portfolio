import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Download, ExternalLink, Github, Linkedin, Mail } from 'lucide-react';
import { getSortedPostsData } from '@/lib/posts';
import { projects } from '@/lib/projects';
import { siteConfig } from '@/lib/config';

const nbaBuild = [
  'Player search and dynamic routes',
  'Server-backed PostgreSQL queries',
  'Interactive career and peak dashboards',
  'Prediction and comparison features',
];

export default function Home() {
  const posts = getSortedPostsData();
  const nbaProject = projects.find((project) => project.kind === 'independent');
  const coursework = projects.filter((project) => project.kind === 'coursework');
  const selectedPosts = ['my-name', 'green-bazar-code-switching', '2026-03-20-emg-to-text-decoding']
    .map((id) => posts.find((post) => post.id === id))
    .filter((post): post is (typeof posts)[number] => Boolean(post));

  if (!nbaProject) return null;

  return (
    <div className="space-y-24 pb-8 md:space-y-32">
      <section className="pt-3 md:pt-10">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_15rem] md:gap-16 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="max-w-3xl">
            <p className="text-accent mb-4 font-mono text-xs tracking-[0.16em] uppercase">
              Software engineer · Vancouver, BC
            </p>
            <h1 className="mb-6 text-4xl leading-[1.08] font-bold tracking-[-0.025em] text-balance md:text-6xl lg:text-7xl">
              Hey, I&apos;m Jace.
            </h1>
            <p className="text-muted mb-8 max-w-2xl text-lg leading-8 md:text-xl">
              I&apos;m from Kazakhstan, graduated from UCLA with a degree in computer science and a
              minor in anthropology, and I&apos;m now working toward an M.S. in computer science at
              Northeastern University in Vancouver. I&apos;m looking for summer 2027 internships and
              full-time software engineering roles.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/projects/nba"
                className="bg-accent text-background hover:bg-foreground inline-flex items-center gap-2 rounded-sm px-5 py-3 font-mono text-sm transition-colors"
              >
                See the NBA project <ArrowRight size={16} />
              </Link>
              <a
                href="/jace-kasen-resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="border-border hover:border-accent hover:text-accent inline-flex items-center gap-2 rounded-sm border px-5 py-3 font-mono text-sm transition-colors"
              >
                Résumé <Download size={16} />
              </a>
              <a
                href={siteConfig.socials.email}
                className="text-accent inline-flex items-center gap-2 px-2 py-3 font-mono text-sm font-bold hover:underline"
              >
                Email me <Mail size={16} />
              </a>
            </div>
          </div>

          <div className="relative mx-auto aspect-[4/5] w-56 md:w-full">
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

      <section id="work" className="scroll-mt-24">
        <div className="border-border/80 mb-8 flex items-end justify-between gap-6 border-b pb-4">
          <div>
            <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">
              NBA project
            </p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              NBA Performance Analysis
            </h2>
          </div>
          <p className="text-muted hidden max-w-sm text-right text-sm leading-6 md:block">
            I have followed the league closely since 2019. This started as a question I wanted to
            investigate for myself.
          </p>
        </div>

        <article className="on-ink bg-ink text-on-ink grid gap-9 p-7 md:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)] md:p-10">
          <div>
            <p className="text-accent mb-3 font-mono text-xs tracking-[0.16em] uppercase">
              {nbaProject.eyebrow}
            </p>
            <h3 className="mb-5 text-3xl leading-tight font-bold md:text-4xl">
              {nbaProject.title}
            </h3>
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
                className="bg-accent text-background hover:bg-foreground inline-flex items-center gap-2 rounded-sm px-5 py-3 font-mono text-sm font-bold transition-colors"
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

      <section>
        <div className="mb-8 max-w-2xl">
          <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">
            Coursework
          </p>
          <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
            Coursework projects
          </h2>
          <p className="text-muted leading-7">
            These projects were completed as coursework at UCLA.
          </p>
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

      <section>
        <div className="border-border/80 mb-7 flex items-end justify-between border-b pb-4">
          <div>
            <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">
              A little more about me
            </p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Things I&apos;ve written
            </h2>
          </div>
          <Link
            href="/blog"
            className="text-accent hidden font-mono text-sm hover:underline sm:block"
          >
            All writing →
          </Link>
        </div>
        <div className="divide-border divide-y">
          {selectedPosts.map((post, index) => (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
              className="group hover:bg-surface -mx-3 grid gap-2 px-3 py-5 transition-colors sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-5"
            >
              <span className="text-accent font-mono text-xs font-bold">0{index + 1}</span>
              <span>
                <span className="group-hover:text-accent block text-lg font-bold transition-colors">
                  {post.title}
                </span>
                {post.description && (
                  <span className="text-muted mt-1 block max-w-2xl text-sm leading-6">
                    {post.description}
                  </span>
                )}
              </span>
              <ArrowRight
                className="text-accent hidden transition-transform group-hover:translate-x-1 sm:block"
                size={17}
              />
            </Link>
          ))}
        </div>
      </section>

      <section className="on-ink bg-ink text-on-ink grid gap-8 p-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-10">
        <div>
          <p className="text-accent mb-3 font-mono text-xs tracking-[0.16em] uppercase">
            What I&apos;m looking for
          </p>
          <h2 className="mb-4 max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
            I&apos;m looking for summer 2027 internships and full-time software engineering roles.
          </h2>
          <p className="text-on-ink-muted max-w-2xl text-lg leading-7">
            I care more about the project, the team, and the chance to learn than a specific job
            title, so I&apos;m open to a variety of roles.
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
