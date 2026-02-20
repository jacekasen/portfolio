import { Github, ExternalLink } from 'lucide-react';

export const metadata = {
  title: 'Projects | Jace Kasen',
  description: 'Projects and experiments.',
};

const projects = [
  {
    title: 'This Portfolio Website',
    description:
      'LLM Generated Portfolio website built with Next.js, Tailwind CSS, and Markdown using Cursor IDE.',
    tags: ['Cursor', 'Next.js', 'React with TypeScript', 'Tailwind CSS', 'Vercel'],
    github: 'https://github.com/jankasen/portfolio',
    demo: '/projects',
  },
  // Add more projects here
];

export default function Projects() {
  return (
    <div className="space-y-12 md:space-y-16">
      <header className="pt-8 md:pt-12">
        <h1 className="mb-4 font-mono text-4xl tracking-tight md:text-5xl">Projects</h1>
        <p className="text-muted max-w-xl text-xl leading-relaxed">
          A collection of my work in software engineering and machine learning.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {projects.map((project, index) => (
          <div
            key={index}
            className="border-border bg-surface rounded-xl border p-6 transition-shadow hover:shadow-lg"
          >
            <h2 className="mb-3 text-xl font-bold">{project.title}</h2>
            <p className="text-muted mb-6 h-20 overflow-hidden text-sm">{project.description}</p>

            <div className="mb-6 flex flex-wrap gap-2 font-mono text-xs">
              {project.tags.map((tag) => (
                <span key={tag} className="bg-accent-light/30 text-accent rounded px-2 py-1">
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
                  className="text-muted hover:text-accent flex items-center gap-2 transition-colors"
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
                  className="text-muted hover:text-accent flex items-center gap-2 transition-colors"
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
