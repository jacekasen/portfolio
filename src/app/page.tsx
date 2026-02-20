import Link from 'next/link';
import Image from 'next/image';
import { getSortedPostsData } from '@/lib/posts';
import { siteConfig } from '@/lib/config';
import { format, parseISO } from 'date-fns';
import { ArrowRight, BookOpen, Github, Linkedin, Mail } from 'lucide-react';

export default function Home() {
  const allPostsData = getSortedPostsData();
  const recentPosts = allPostsData.slice(0, 3);

  return (
    <div className="space-y-12 md:space-y-16">
      {/* Hero Section */}
      <section className="pt-8 md:pt-12">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:gap-12">
          <div className="w-full flex-1">
            <h1 className="mb-6 font-mono text-4xl tracking-tight md:mb-6 md:text-5xl">
              what's good, i'm jace
            </h1>

            {/* Mobile image - shown only on small screens */}
            <div className="relative mx-auto mb-6 h-48 w-48 md:hidden">
              <div className="from-accent to-accent-light absolute inset-0 animate-pulse rounded-full bg-gradient-to-tr opacity-30 blur-2xl" />
              <Image
                src="/hero_shot.png"
                alt="Jace Kasen"
                fill
                className="border-surface relative z-10 rounded-full border-4 object-cover shadow-2xl"
                priority
              />
            </div>

            <p className="text-muted mb-6 max-w-xl text-xl leading-relaxed">
              computer science student @ ucla focused on machine learning and software engineering
            </p>
            <div className="mb-10 flex flex-wrap gap-4 font-mono text-sm">
              <Link
                href="/projects"
                className="text-background bg-accent hover:bg-accent/90 inline-flex items-center justify-center rounded-md border border-transparent px-5 py-2.5 transition-colors"
              >
                Projects
              </Link>
              <Link
                href="/about"
                className="border-border text-foreground bg-surface hover:bg-accent-light/20 inline-flex items-center justify-center rounded-md border px-5 py-2.5 transition-colors"
              >
                About Me
              </Link>
            </div>
            <div className="text-muted flex items-center gap-6">
              <a
                href={siteConfig.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                <Github size={22} />
              </a>
              <a
                href={siteConfig.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                <Linkedin size={22} />
              </a>
              <a href={siteConfig.socials.email} className="hover:text-accent transition-colors">
                <Mail size={22} />
              </a>
            </div>
          </div>

          {/* Desktop image - shown only on medium screens and up */}
          <div className="relative hidden h-72 w-72 flex-shrink-0 md:block">
            <div className="from-accent to-accent-light absolute inset-0 animate-pulse rounded-full bg-gradient-to-tr opacity-30 blur-2xl" />
            <Image
              src="/hero_shot.png"
              alt="Jace Kasen"
              fill
              className="border-surface relative z-10 rounded-full border-4 object-cover shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Recent Posts Section */}
      <section>
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-mono text-2xl">Recent Writing</h2>
          <Link
            href="/blog"
            className="text-accent flex items-center gap-2 font-mono text-sm hover:underline"
          >
            view all <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recentPosts.map(({ id, title, description, date }) => (
            <Link key={id} href={`/blog/${id}`} className="group block">
              <div className="bg-surface border-border hover:border-accent h-full rounded-xl border p-6 shadow-sm transition-colors hover:shadow-md">
                <div className="text-muted mb-3 flex items-center gap-2 font-mono text-xs">
                  <BookOpen size={14} />
                  <time>{format(parseISO(date), 'yyyy-MM-dd')}</time>
                </div>
                <h3 className="group-hover:text-accent mb-2 text-lg font-bold transition-colors">
                  {title}
                </h3>
                {description && <p className="text-muted line-clamp-3 text-sm">{description}</p>}
              </div>
            </Link>
          ))}
          {recentPosts.length === 0 && <p className="text-muted italic">No posts yet.</p>}
        </div>
      </section>
    </div>
  );
}
