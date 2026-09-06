import path from 'path';
import { PageHeader } from '@/components/PageHeader';
import { getMarkdownData } from '@/lib/posts';

export const metadata = {
  title: 'About | Jace Kasen',
  description: 'About Jace Kasen',
};

export default async function About() {
  const filePath = path.join(process.cwd(), 'content', 'about.md');
  const postData = await getMarkdownData(filePath);

  return (
    <div className="space-y-10 md:space-y-14">
      <PageHeader
        eyebrow="Background and interests"
        title="About"
        description={postData.updated ? `Last updated ${postData.updated}` : undefined}
      />

      <div
        className="prose prose-lg prose-headings:font-bold prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-pre:bg-surface prose-pre:border prose-pre:border-border prose-code:text-accent prose-code:bg-accent-light/20 prose-code:px-1 prose-code:rounded prose-blockquote:border-accent prose-blockquote:text-muted prose-img:rounded-lg prose-p:leading-7 max-w-none font-serif"
        dangerouslySetInnerHTML={{ __html: postData.contentHtml || '' }}
      />
    </div>
  );
}
