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
    <div className="max-w-3xl mx-auto">
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl font-mono mb-4">
          Blog
        </h1>
        <p className="text-lg text-muted">
          Some of my thoughts and attempts at anwering my questions.
        </p>
      </header>

      <div className="space-y-10">
        {allPostsData.length > 0 ? (
          allPostsData.map(({ id, date, title, description, tags }) => (
            <article key={id} className="group relative border-b border-border pb-8">
              <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-2">
                <h2 className="text-xl font-bold group-hover:text-accent transition-colors">
                  <Link href={`/blog/${id}`}>
                    <span className="absolute inset-0" />
                    {title}
                  </Link>
                </h2>
                <time className="text-xs text-muted font-mono whitespace-nowrap md:ml-4">
                  {format(parseISO(date), 'yyyy-MM-dd')}
                </time>
              </div>
              
              {description && (
                <p className="text-muted mb-4 line-clamp-3">
                  {description}
                </p>
              )}
              
              {tags && (
                <div className="flex flex-wrap gap-2 relative z-10 font-mono text-xs">
                  {tags.map((tag: string) => (
                    <span 
                      key={tag}
                      className="px-2 py-1 rounded bg-accent-light/30 text-accent"
                    >
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
