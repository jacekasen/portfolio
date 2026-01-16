import Link from "next/link";
import Image from "next/image";
import { getSortedPostsData } from "@/lib/posts";
import { ArrowRight, BookOpen, Github, Linkedin, Mail } from "lucide-react";

export default function Home() {
  const allPostsData = getSortedPostsData();
  const recentPosts = allPostsData.slice(0, 3);

  return (
    <div className="space-y-12 md:space-y-16">
      {/* Hero Section */}
      <section className="flex flex-col-reverse md:flex-row items-center justify-between gap-8 md:gap-12 py-8 md:py-12">
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl md:text-5xl font-mono tracking-tight">
            what's good, i'm jace
          </h1>
          <p className="text-xl text-muted leading-relaxed max-w-xl">
            computer science student @ ucla focused on machine learning and software engineering
          </p>
          <div className="flex flex-wrap gap-4 font-mono text-sm">
            <Link 
              href="/projects" 
              className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent rounded-md text-white bg-accent hover:bg-accent/90 transition-colors"
            >
              Projects
            </Link>
            <Link 
              href="/about" 
              className="inline-flex items-center justify-center px-5 py-2.5 border border-border rounded-md text-foreground bg-surface hover:bg-accent-light/20 transition-colors"
            >
              About Me
            </Link>
          </div>
          <div className="flex items-center gap-6 pt-4 text-muted">
             <a href="https://github.com/jacekasen" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
               <Github size={22} />
             </a>
             <a href="https://linkedin.com/in/jacekasen" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
               <Linkedin size={22} />
             </a>
             <a href="mailto:jace@jacekasen.com" className="hover:text-accent transition-colors">
               <Mail size={22} />
             </a>
          </div>
        </div>
        <div className="relative w-64 h-64 md:w-72 md:h-72 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-accent to-accent-light rounded-full blur-2xl opacity-30 animate-pulse" />
          <Image
            src="/profile_pic.jpeg"
            alt="Jace Kasen"
            fill
            className="rounded-full object-cover border-4 border-surface shadow-2xl relative z-10"
            priority
          />
        </div>
      </section>

      {/* Recent Posts Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-mono">
            Recent Writing
          </h2>
          <Link href="/blog" className="flex items-center gap-2 text-accent hover:underline font-mono text-sm">
            view all <ArrowRight size={14} />
          </Link>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recentPosts.map(({ id, title, description, date }) => (
            <Link key={id} href={`/blog/${id}`} className="group block">
              <div className="h-full p-6 bg-surface border border-border rounded-xl hover:border-accent transition-colors shadow-sm hover:shadow-md">
                <div className="flex items-center gap-2 text-xs text-muted mb-3 font-mono">
                  <BookOpen size={14} />
                  <time>{date}</time>
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-accent transition-colors">
                  {title}
                </h3>
                {description && (
                  <p className="text-muted text-sm line-clamp-3">
                    {description}
                  </p>
                )}
              </div>
            </Link>
          ))}
          {recentPosts.length === 0 && (
             <p className="text-muted italic">No posts yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
