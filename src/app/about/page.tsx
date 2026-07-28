import path from 'path';
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
      <header className="pt-4 md:pt-8">
        <h1 className="mb-3 font-mono text-4xl tracking-tight md:text-5xl">About</h1>
        {postData.updated && (
          <p className="text-muted max-w-2xl text-lg leading-7">last updated {postData.updated}</p>
        )}
      </header>

      <div
        className="prose prose-lg prose-headings:font-bold prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-pre:bg-surface prose-pre:border prose-pre:border-border prose-code:text-accent prose-code:bg-accent-light/20 prose-code:px-1 prose-code:rounded prose-blockquote:border-accent prose-blockquote:text-muted prose-img:rounded-lg max-w-none font-serif prose-p:leading-7"
        dangerouslySetInnerHTML={{ __html: postData.contentHtml || '' }}
      />
    </div>
  );
}
