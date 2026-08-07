import Link from 'next/link';
import Image from 'next/image';
import { getSortedPostsData } from '@/lib/posts';
import { projects } from '@/lib/projects';
import { siteConfig } from '@/lib/config';
import { format, parseISO } from 'date-fns';
import { ExternalLink, Github, Linkedin, Mail } from 'lucide-react';

export default function Home() {
  const allPostsData = getSortedPostsData();
  const recentPosts = allPostsData.slice(0, 10);

  return (
    <div className="space-y-14 md:space-y-18">
      {/* Hero Section */}
      <section className="pt-4 md:pt-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:gap-14">
          <div className="flex-1 max-w-2xl">
            <h1 className="mb-3 font-mono text-4xl tracking-tight md:text-5xl">Jace Kasen</h1>
            <p className="text-muted mb-5 font-mono text-sm uppercase tracking-[0.16em]">
              Computer Science Graduate @ UCLA
            </p>
            <p className="text-foreground mb-7 max-w-xl leading-7">
              CS Major + Anthropology Minor, UCLA Class of 2026. Looking for software engineering and
              machine learning roles.
            </p>
            <div className="mb-7 flex flex-wrap gap-6 font-mono text-sm">
              <Link
                href="/#projects"
                className="text-accent inline-flex items-center gap-1.5 transition-colors hover:underline"
              >
                Projects →
              </Link>
              <Link
                href="/about"
                className="text-accent inline-flex items-center gap-1.5 transition-colors hover:underline"
              >
                About →
              </Link>
            </div>
            <div className="text-muted flex items-center gap-5">
              <a
                href={siteConfig.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-accent"
              >
                <Github size={20} />
              </a>
              <a
                href={siteConfig.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-accent"
              >
                <Linkedin size={20} />
              </a>
              <a href={siteConfig.socials.email} className="transition-colors hover:text-accent">
                <Mail size={20} />
              </a>
            </div>
          </div>

          <div className="relative order-first h-48 w-48 flex-shrink-0 md:order-last md:h-56 md:w-56">
            <Image
              src="/hero_shot.png"
              alt="Jace Kasen"
              fill
              sizes="(min-width: 768px) 14rem, 12rem"
              className="rounded-full object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="scroll-mt-24">
        <div className="border-border/80 mb-6 border-b pb-3">
          <h2 className="font-mono text-2xl">Projects</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {projects.map((project) => (
            <article key={project.title} className="border-border/80 bg-surface/50 border p-5">
              <h3 className="mb-2 text-lg font-bold">{project.title}</h3>
              <p className="text-muted mb-4 line-clamp-3 text-sm leading-6">
                {project.description}
              </p>
              <div className="mb-4 flex flex-wrap gap-2 font-mono text-xs">
                {project.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="bg-accent-light/20 text-accent rounded px-2 py-1">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex gap-4 font-mono text-xs">
                {project.demo && (
                  <Link
                    href={project.demo}
                    className="hover:text-accent inline-flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink size={13} />
                    view project
                  </Link>
                )}
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent inline-flex items-center gap-1 transition-colors"
                  >
                    <Github size={13} />
                    code
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Recent Posts Section */}
      <section>
        <div className="border-border/80 mb-6 flex items-center justify-between border-b pb-3">
          <h2 className="font-mono text-2xl">Recent Writing</h2>
          <Link
            href="/blog"
            className="text-accent inline-flex items-center gap-1.5 font-mono text-sm hover:underline"
          >
            view all →
          </Link>
        </div>

        <div className="flex flex-col">
          {recentPosts.map(({ id, title, date }) => (
            <Link
              key={id}
              href={`/blog/${id}`}
              className="group flex items-baseline gap-6 py-2"
            >
              <time className="text-muted w-24 flex-shrink-0 font-mono text-xs">
                {format(parseISO(date), 'yyyy-MM-dd')}
              </time>
              <span className="group-hover:text-accent transition-colors">
                {title}
              </span>
            </Link>
          ))}
          {recentPosts.length === 0 && <p className="text-muted italic">No posts yet.</p>}
        </div>
      </section>
    </div>
  );
}
