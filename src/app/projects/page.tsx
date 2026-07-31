import Link from 'next/link';
import { Github, ExternalLink } from 'lucide-react';

export const metadata = {
  title: 'Projects | Jace Kasen',
  description: 'Projects and experiments.',
};

const projects = [
  {
    title: 'NBA Peak Analysis',
    description:
      'An interactive exploration of NBA player peaks using cleaned Basketball Reference season data stored in Supabase.',
    tags: ['Python', 'Pandas', 'Supabase', 'PostgreSQL', 'Next.js'],
    github: 'https://github.com/jacekasen/nba-peak-analysis',
    demo: '/projects/nba',
  },
  {
    title: 'MD/HD Vehicle Detection via Satellite Imagery',
    description:
      'Fine-tuned a Faster R-CNN (ResNet50-FPN) on the DOTA aerial dataset to detect medium and heavy-duty trucks in Google Maps satellite tiles. Generated a vehicle density heat map over the UCLA campus area to inform EV charging infrastructure planning.',
    tags: ['Python', 'PyTorch', 'Computer Vision', 'ResNet50', 'FPN', 'Google Maps API'],
    github: null,
    demo: '/blog/2025-12-13-team41-truckdetection',
  },
  {
    title: 'This Portfolio Website',
    description:
      'Portfolio and blog built with Next.js, Tailwind CSS, and Markdown, developed using Cursor IDE.',
    tags: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Vercel'],
    github: 'https://github.com/jankasen/portfolio',
    demo: null,
  },
  // Add more projects here
];

export default function Projects() {
  return (
    <div className="space-y-10 md:space-y-14">
      <header className="pt-4 md:pt-8">
        <h1 className="mb-3 font-mono text-4xl tracking-tight md:text-5xl">Projects</h1>
        <p className="text-muted max-w-2xl text-lg leading-7">
          Software engineering and machine learning work.
        </p>
      </header>

      <div className="space-y-8 md:space-y-10">
        {projects.map((project, index) => (
          <article key={index} className="border-border/80 border-b pb-8">
            <div className="mb-2 flex flex-col md:flex-row md:items-baseline md:justify-between">
              <h2 className="text-xl font-bold">{project.title}</h2>
              <div className="text-muted flex flex-shrink-0 items-center gap-4 font-mono text-xs whitespace-nowrap md:ml-4">
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent flex items-center gap-1 transition-colors"
                  >
                    <Github size={13} />
                    code
                  </a>
                )}
                {project.demo && (
                  <Link
                    href={project.demo}
                    className="hover:text-accent flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink size={13} />
                    view
                  </Link>
                )}
              </div>
            </div>

            <p className="text-muted mb-4 line-clamp-3">{project.description}</p>

            <div className="flex flex-wrap gap-2 font-mono text-xs">
              {project.tags.map((tag) => (
                <span key={tag} className="bg-accent-light/20 text-accent rounded px-2 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
