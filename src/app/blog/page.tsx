import Link from 'next/link';
import { getSortedPostsData } from '@/lib/posts';
import { format, parseISO } from 'date-fns';

export const metadata = {
  title: 'Blog | Jace Kasen',
  description: 'Writing about software engineering, machine learning, and more.',
};

export default function BlogIndex() {
  const allPostsData = getSortedPostsData();

  return (
    <div className="space-y-12 md:space-y-16">
      <header className="pt-8 md:pt-12">
        <h1 className="mb-4 font-mono text-4xl tracking-tight md:text-5xl">Blog</h1>
        <p className="text-muted text-xl leading-relaxed">
          Some of my thoughts and attempts at answering my questions.
        </p>
      </header>

      <div className="space-y-10">
        {allPostsData.length > 0 ? (
          allPostsData.map(({ id, date, title, description, tags }) => (
            <article key={id} className="group border-border relative border-b pb-8">
              <div className="mb-2 flex flex-col md:flex-row md:items-baseline md:justify-between">
                <h2 className="group-hover:text-accent text-xl font-bold transition-colors">
                  <Link href={`/blog/${id}`}>
                    <span className="absolute inset-0" />
                    {title}
                  </Link>
                </h2>
                <time className="text-muted font-mono text-xs whitespace-nowrap md:ml-4">
                  {format(parseISO(date), 'yyyy-MM-dd')}
                </time>
              </div>

              {description && <p className="text-muted mb-4 line-clamp-3">{description}</p>}

              {tags && (
                <div className="relative z-10 flex flex-wrap gap-2 font-mono text-xs">
                  {tags.map((tag: string) => (
                    <span key={tag} className="bg-accent-light/30 text-accent rounded px-2 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))
        ) : (
          <p className="text-muted italic">No posts found.</p>
        )}
      </div>
    </div>
  );
}
