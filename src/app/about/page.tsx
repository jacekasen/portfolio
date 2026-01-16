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
      <header className="pt-8 md:pt-12 mb-2">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-mono tracking-tight">
            About Me
          </h1>
          <p className="text-xl text-muted leading-relaxed max-w-xl">
            computer science student @ ucla
          </p>
          {postData.updated && (
            <p className="text-xs text-muted font-mono opacity-70">
              updated: {postData.updated}
            </p>
          )}
        </div>
      </header>
      
      <div className="max-w-3xl">
        <div 
          className="prose prose-lg dark:prose-invert max-w-none
            prose-headings:font-bold prose-a:text-accent
            prose-code:font-mono prose-code:text-accent prose-code:bg-accent-light/20"
          dangerouslySetInnerHTML={{ __html: postData.contentHtml || '' }} 
        />
      </div>
    </div>
  );
}
