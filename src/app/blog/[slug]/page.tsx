import { getAllPostSlugs, getPostData } from '@/lib/posts';
import { format, parseISO } from 'date-fns';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const postData = await getPostData(slug);
    return {
      title: `${postData.title} | Jace Kasen`,
      description: postData.description || 'Blog post',
    };
  } catch {
    return {
      title: 'Post Not Found',
    };
  }
}

export async function generateStaticParams() {
  return getAllPostSlugs();
}

export default async function Post({ params }: Props) {
  const { slug } = await params;
  const postData = await getPostData(slug).catch(() => notFound());

  return (
    <article className="space-y-8">
      <div className="border-border border-b pb-8">
        <PageHeader
          eyebrow={format(parseISO(postData.date), 'yyyy-MM-dd')}
          title={postData.title}
          description={
            <>
              {postData.tags && (
                <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
                  {postData.tags.map((tag: string) => (
                    <span key={tag} className="bg-accent-light/25 text-accent rounded-md px-2 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div>
                <Link
                  href="/blog"
                  className="text-accent inline-flex items-center gap-2 font-mono text-sm font-bold transition-colors hover:underline"
                >
                  <ArrowLeft size={16} />
                  back to blog
                </Link>
              </div>
            </>
          }
        />
      </div>

      <div
        className="prose prose-lg prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-pre:bg-surface prose-pre:border prose-pre:border-border prose-code:text-accent prose-code:bg-accent-light/20 prose-code:px-1 prose-code:rounded prose-blockquote:border-accent prose-blockquote:text-muted prose-img:rounded-lg max-w-none font-serif"
        dangerouslySetInnerHTML={{ __html: postData.contentHtml || '' }}
      />
    </article>
  );
}
