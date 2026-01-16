import { Github, ExternalLink } from 'lucide-react';

export const metadata = {
  title: 'Projects | Jace Kasen',
  description: 'Projects and experiments.',
};

const projects = [
  {
    title: 'This Portfolio Website',
    description: 'LLM Generated Portfolio website built with Next.js, Tailwind CSS, and Markdown using Cursor IDE.',
    tags: ['Cursor', 'Next.js', 'React', 'Tailwind'],
    github: 'https://github.com/jankasen/portfolio',
    demo: '/projects',
  },
  // Add more projects here
];

export default function Projects() {
  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8 md:mb-12">
        <h1 className="text-4xl font-bold mb-4">Projects</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          A collection of my work in software engineering and machine learning.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project, index) => (
          <div 
            key={index}
            className="border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:shadow-lg transition-shadow bg-white dark:bg-gray-900/50"
          >
            <h2 className="text-2xl font-bold mb-3">{project.title}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 h-20 overflow-hidden">
              {project.description}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {project.tags.map(tag => (
                <span key={tag} className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="flex gap-4">
              {project.github && (
                <a 
                  href={project.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                >
                  <Github size={18} />
                  Code
                </a>
              )}
              {project.demo && (
                <a 
                  href={project.demo} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                >
                  <ExternalLink size={18} />
                  Live Demo
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
