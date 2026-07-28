import Link from 'next/link';
import Image from 'next/image';
import { getSortedPostsData } from '@/lib/posts';
import { siteConfig } from '@/lib/config';
import { format, parseISO } from 'date-fns';
import { Github, Linkedin, Mail } from 'lucide-react';

export default function Home() {
  const allPostsData = getSortedPostsData();
  const recentPosts = allPostsData.slice(0, 3);

  return (
    <div className="space-y-16 md:space-y-20">
      {/* Hero Section */}
      <section className="pt-8 md:pt-12">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:gap-16">
          <div className="flex-1">
            <h1 className="mb-3 font-mono text-4xl tracking-tight md:text-5xl">Jace Kasen</h1>
            <p className="text-muted mb-6 font-mono text-sm">
              Computer Science Graduate @ UCLA
            </p>
            <p className="text-foreground mb-8 max-w-lg leading-relaxed">
              CS Major + Anthropology Minor, UCLA Class of 2026. Looking for software engineering and
              machine learning roles.
            </p>
            <div className="mb-8 flex flex-wrap gap-6 font-mono text-sm">
              <Link
                href="/projects"
                className="text-accent hover:underline inline-flex items-center gap-1.5 transition-colors"
              >
                Projects →
              </Link>
              <Link
                href="/about"
                className="text-accent hover:underline inline-flex items-center gap-1.5 transition-colors"
              >
                About →
              </Link>
            </div>
            <div className="text-muted flex items-center gap-5">
              <a
                href={siteConfig.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                <Github size={20} />
              </a>
              <a
                href={siteConfig.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                <Linkedin size={20} />
              </a>
              <a href={siteConfig.socials.email} className="hover:text-accent transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>

          <div className="relative h-48 w-48 flex-shrink-0 order-first md:order-last md:h-56 md:w-56">
            <Image
              src="/hero_shot.png"
              alt="Jace Kasen"
              fill
              className="rounded-full object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Recent Posts Section */}
      <section>
        <div className="border-border mb-6 flex items-center justify-between border-b pb-3">
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
