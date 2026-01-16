import Link from "next/link";
import Image from "next/image";
import { getSortedPostsData } from "@/lib/posts";
import { ArrowRight, BookOpen, Github, Linkedin, Mail } from "lucide-react";

export default function Home() {
  const allPostsData = getSortedPostsData();
  const recentPosts = allPostsData.slice(0, 3);

  return (
    <div className="space-y-12 md:space-y-16">
      {/* Hero Section */}
      <section className="flex flex-col-reverse md:flex-row items-center justify-between gap-8 md:gap-12 py-8 md:py-12">
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Hi, I&apos;m <span className="text-blue-600 dark:text-blue-400">Jace</span>.
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl">
            Computer Science student @ UCLA focused on Machine Learning and Software Engineering
          </p>
          <div className="flex gap-4">
            <Link 
              href="/projects" 
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              View Projects
            </Link>
            <Link 
              href="/about" 
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-700 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              More About Me
            </Link>
          </div>
          <div className="flex items-center gap-6 pt-4 text-gray-500">
             <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-black dark:hover:text-white transition-colors">
               <Github size={24} />
             </a>
             <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
               <Linkedin size={24} />
             </a>
             <a href="mailto:jace@jacekasen.com" className="hover:text-black dark:hover:text-white transition-colors">
               <Mail size={24} />
             </a>
          </div>
        </div>
        <div className="relative w-64 h-64 md:w-80 md:h-80 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full blur-2xl opacity-20 dark:opacity-40 animate-pulse" />
          <Image
            src="/profile_pic.jpeg"
            alt="Jace Kasen"
            fill
            className="rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-2xl relative z-10"
            priority
          />
        </div>
      </section>

      {/* Recent Posts Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Recent Writing</h2>
          <Link href="/blog" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline">
            View all posts <ArrowRight size={16} />
          </Link>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recentPosts.map(({ id, title, description, date }) => (
            <Link key={id} href={`/blog/${id}`} className="group block">
              <div className="h-full p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-colors shadow-sm hover:shadow-md">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <BookOpen size={16} />
                  <time>{date}</time>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {title}
                </h3>
                {description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
                    {description}
                  </p>
                )}
              </div>
            </Link>
          ))}
          {recentPosts.length === 0 && (
             <p className="text-gray-500 italic">No posts yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
