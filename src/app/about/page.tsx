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
          <div className="relative w-48 h-48 lg:w-64 lg:h-64 mb-6">
             <Image
              src="/about_me_pic.png"
              alt="Jace Kasen"
              fill
              className="rounded-full object-cover shadow-lg"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold mb-2">About Me</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 whitespace-nowrap">
              Computer Science Student @ UCLA
          </p>
        </aside>
        
        {/* Main Content */}
        <div className="w-full lg:flex-1">
          <div 
            className="prose prose-lg dark:prose-invert max-w-none font-serif
              prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-blue-400"
            dangerouslySetInnerHTML={{ __html: postData.contentHtml || '' }} 
          />
        </div>
      </div>
    </div>
  );
}
