import { getAllPostIds, getPostData } from '@/lib/posts';
import { format, parseISO } from 'date-fns';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

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
  } catch {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-8 border-b border-border pb-8">
        <h1 className="text-3xl font-bold mb-4">{postData.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-muted text-xs font-mono">
          <time>
            {format(parseISO(postData.date), 'yyyy-MM-dd')}
          </time>
          {postData.tags && postData.tags.map((tag: string) => (
            <span key={tag} className="px-2 py-1 bg-accent-light/30 text-accent rounded">
              {tag}
            </span>
          ))}
        </div>
      </header>
      
      <div 
        className="prose prose-lg dark:prose-invert max-w-none
          prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl 
          prose-a:text-accent prose-a:no-underline hover:prose-a:underline
          prose-pre:bg-surface prose-pre:border prose-pre:border-border prose-pre:font-mono
          prose-code:text-accent prose-code:bg-accent-light/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm
          prose-img:rounded-lg"
        dangerouslySetInnerHTML={{ __html: postData.contentHtml || '' }} 
      />
    </article>
  );
}
