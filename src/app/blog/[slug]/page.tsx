import { getAllPostIds, getPostData } from '@/lib/posts';
import { format, parseISO } from 'date-fns';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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
  } catch (e) {
    return {
      title: 'Post Not Found',
    };
  }
}

export async function generateStaticParams() {
  const paths = getAllPostIds();
  return paths.map((path) => ({
    slug: path.params.slug,
  }));
}

export default async function Post({ params }: Props) {
  const { slug } = await params;
  
  let postData;
  try {
    postData = await getPostData(slug);
  } catch (error) {
    notFound();
  }

  return (
    <article>
      <header className="pt-8 md:pt-12 mb-8 border-b border-border pb-8">
        <h1 className="text-4xl md:text-5xl font-mono tracking-tight mb-4">{postData.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-muted text-sm font-mono mb-6">
          <time>
            {format(parseISO(postData.date), 'yyyy-MM-dd')}
          </time>
          {postData.tags && postData.tags.map((tag: string) => (
            <span key={tag} className="px-2 py-1 bg-accent-light/30 text-accent rounded-md">
              {tag}
            </span>
          ))}
        </div>
        <Link 
          href="/blog" 
          className="inline-flex items-center gap-2 text-muted hover:text-accent transition-colors font-mono text-sm"
        >
          <ArrowLeft size={16} />
          back to blog
        </Link>
      </header>
      
      <div 
        className="prose prose-lg dark:prose-invert max-w-none font-serif
          prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl 
          prose-a:text-accent prose-a:no-underline hover:prose-a:underline
          prose-pre:bg-surface prose-pre:border prose-pre:border-border
          prose-code:text-accent prose-code:bg-accent-light/20 prose-code:px-1 prose-code:rounded
          prose-blockquote:border-accent prose-blockquote:text-muted
          prose-img:rounded-lg"
        dangerouslySetInnerHTML={{ __html: postData.contentHtml || '' }} 
      />
    </article>
  );
}
