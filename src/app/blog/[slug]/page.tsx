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
      <header className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-8">
        <h1 className="text-4xl font-bold mb-4">{postData.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm">
          <time className="font-medium">
            {format(parseISO(postData.date), 'MMMM d, yyyy')}
          </time>
          {postData.tags && postData.tags.map((tag: string) => (
            <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
              {tag}
            </span>
          ))}
        </div>
      </header>
      
      <div 
        className="prose prose-lg dark:prose-invert max-w-none font-serif
          prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl 
          prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
          prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:text-gray-900 dark:prose-pre:text-gray-100
          prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-blue-50 dark:prose-code:bg-blue-900/20 prose-code:px-1 prose-code:rounded
          prose-img:rounded-lg"
        dangerouslySetInnerHTML={{ __html: postData.contentHtml || '' }} 
      />
    </article>
  );
}
