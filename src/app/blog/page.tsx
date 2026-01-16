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
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Thoughts, tutorials, and notes on software and machine learning.
        </p>
      </header>

      <div className="space-y-10">
        {allPostsData.length > 0 ? (
          allPostsData.map(({ id, date, title, description, tags }) => (
            <article key={id} className="group relative border-b border-gray-200 dark:border-gray-800 pb-8">
              <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-2">
                <h2 className="text-2xl font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <Link href={`/blog/${id}`}>
                    <span className="absolute inset-0" />
                    {title}
                  </Link>
                </h2>
                <time className="text-sm text-gray-500 font-medium whitespace-nowrap md:ml-4">
                  {format(parseISO(date), 'MMMM d, yyyy')}
                </time>
              </div>
              
              {description && (
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                  {description}
                </p>
              )}
              
              {tags && (
                <div className="flex flex-wrap gap-2 relative z-10">
                  {tags.map((tag: string) => (
                    <span 
                      key={tag}
                      className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))
        ) : (
          <p className="text-gray-500 italic">No posts found.</p>
        )}
      </div>
    </div>
  );
}
