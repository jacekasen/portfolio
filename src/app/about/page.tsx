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
    <div className="space-y-12 md:space-y-16">
      <header className="pt-8 md:pt-12">
        <h1 className="mb-4 font-mono text-4xl tracking-tight md:text-5xl">About</h1>
        {postData.updated && (
          <p className="text-muted text-xl leading-relaxed">last updated {postData.updated}</p>
        )}
      </header>

      <div
        className="prose prose-lg prose-headings:font-bold prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-pre:bg-surface prose-pre:border prose-pre:border-border prose-code:text-accent prose-code:bg-accent-light/20 prose-code:px-1 prose-code:rounded prose-blockquote:border-accent prose-blockquote:text-muted prose-img:rounded-lg max-w-none font-serif"
        dangerouslySetInnerHTML={{ __html: postData.contentHtml || '' }}
      />
    </div>
  );
}
