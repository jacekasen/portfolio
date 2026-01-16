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
        <h1 className="text-3xl font-mono mb-4">
          Projects
        </h1>
        <p className="text-lg text-muted">
          A collection of my work in software engineering and machine learning.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project, index) => (
          <div 
            key={index}
            className="border border-border rounded-xl p-6 hover:shadow-lg transition-shadow bg-surface"
          >
            <h2 className="text-xl font-bold mb-3">{project.title}</h2>
            <p className="text-muted mb-6 h-20 overflow-hidden text-sm">
              {project.description}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-6 font-mono text-xs">
              {project.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-accent-light/30 text-accent rounded">
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="flex gap-4 font-mono text-xs">
              {project.github && (
                <a 
                  href={project.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted hover:text-accent transition-colors"
                >
                  <Github size={16} />
                  code
                </a>
              )}
              {project.demo && (
                <a 
                  href={project.demo} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted hover:text-accent transition-colors"
                >
                  <ExternalLink size={16} />
                  demo
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
