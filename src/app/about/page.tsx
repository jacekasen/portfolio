import path from 'path';
import { getMarkdownData } from '@/lib/posts';
import Image from 'next/image';

export const metadata = {
  title: 'About | Jace Kasen',
  description: 'About Jace Kasen',
};

export default async function About() {
  const filePath = path.join(process.cwd(), 'content', 'about.md');
  const postData = await getMarkdownData(filePath);

  return (
    <div className="max-w-6xl mx-auto min-h-[80vh] flex flex-col justify-center">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
        {/* Sidebar / Profile Section */}
        <aside className="w-full lg:w-80 flex flex-col items-center lg:items-start text-center lg:text-left flex-shrink-0 lg:sticky lg:top-8">
          <div className="relative w-48 h-48 lg:w-56 lg:h-56 mb-6">
             <Image
              src="/about_me_pic.png"
              alt="Jace Kasen"
              fill
              className="rounded-full object-cover shadow-lg border-4 border-surface"
              priority
            />
          </div>
          <h1 className="text-2xl font-mono mb-2">
            About Me
          </h1>
          <p className="text-sm text-muted font-mono">
              computer science student @ ucla
          </p>
          {postData.updated && (
            <p className="text-xs text-muted font-mono mt-2 opacity-70">
              updated: {postData.updated}
            </p>
          )}
        </aside>
        
        {/* Main Content */}
        <div className="w-full lg:flex-1">
          <div 
            className="prose prose-lg dark:prose-invert max-w-none
              prose-headings:font-bold prose-a:text-accent
              prose-code:font-mono prose-code:text-accent prose-code:bg-accent-light/20"
            dangerouslySetInnerHTML={{ __html: postData.contentHtml || '' }} 
          />
        </div>
      </div>
    </div>
  );
}
