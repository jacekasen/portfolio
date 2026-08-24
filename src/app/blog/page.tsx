import Link from 'next/link';
import { getSortedPostsData } from '@/lib/posts';
import { format, parseISO } from 'date-fns';

export const metadata = {
  title: 'Writing | Jace Kasen',
  description: 'Notes on software, basketball, language, identity, and whatever else sticks.',
};

export default function BlogIndex() {
  const allPostsData = getSortedPostsData();

  return (
    <div className="space-y-10 md:space-y-14">
      <header className="pt-4 md:pt-8">
        <h1 className="mb-3 text-4xl font-bold tracking-tight md:text-5xl">Writing</h1>
        <p className="text-muted max-w-2xl text-lg leading-7">
          Mostly attempts to answer questions I could not quite leave alone.
        </p>
      </header>

      <div className="space-y-8 md:space-y-10">
        {allPostsData.length > 0 ? (
          allPostsData.map(({ id, date, title, description, tags }) => (
            <article
              key={id}
              className="group border-border/80 hover:bg-surface relative -mx-4 border-b px-4 pt-4 pb-8 transition-colors"
            >
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
                    <span key={tag} className="bg-accent-light/25 text-accent rounded px-2 py-1">
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
