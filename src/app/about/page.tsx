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
    <div>
      <header className="mb-2 pt-8 md:pt-12">
        <div className="space-y-6">
          <h1 className="font-mono text-4xl tracking-tight md:text-5xl">About Me</h1>
          <p className="text-muted max-w-xl text-xl leading-relaxed">
            computer science student @ ucla
          </p>
          {postData.updated && (
            <p className="text-muted font-mono text-xs opacity-70">updated: {postData.updated}</p>
          )}
        </div>
      </header>

      <div className="max-w-3xl">
        <div
          className="prose prose-lg prose-headings:font-bold prose-a:text-accent prose-code:font-mono prose-code:text-accent prose-code:bg-accent-light/20 max-w-none"
          dangerouslySetInnerHTML={{ __html: postData.contentHtml || '' }}
        />
      </div>
    </div>
  );
}
