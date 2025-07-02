import Image from "next/image";
import fs from 'fs';
import path from 'path';

// Function to read and parse the about content
async function getAboutContent() {
  const filePath = path.join(process.cwd(), 'content', 'about.md');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Split content into paragraphs (assuming paragraphs are separated by double newlines)
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
  return paragraphs;
}

export default async function Home() {
  const aboutParagraphs = await getAboutContent();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Hero Section */}
        <section className="mb-16">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-shrink-0">
              <Image
                src="/profile_pic.jpeg"
                alt="Jan Kasen"
                width={300}
                height={300}
                className="rounded-full shadow-lg object-cover"
                priority
              />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Jan Kasen
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300">
                Computer Science Student at UCLA
              </p>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">About Me</h2>
          <div className="prose prose-lg dark:prose-invert mx-auto">
            {aboutParagraphs.map((paragraph, index) => (
              <p key={index} className="text-lg leading-relaxed mb-6">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}