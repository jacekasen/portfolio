export interface Project {
  title: string;
  eyebrow: string;
  kind: 'independent' | 'coursework';
  description: string;
  buildDetails: string;
  tags: string[];
  github: string | null;
  demo: string | null;
}

export const projects: Project[] = [
  {
    title: 'NBA Performance Analysis',
    eyebrow: 'A project I started for fun',
    kind: 'independent',
    description:
      'I have followed the NBA closely since 2019, and the question of when a player peaks - or whether a developing player will keep getting better - comes up all the time. I could have looked up the usual answer, but I wanted to investigate it myself for fun.',
    buildDetails:
      'I also wanted to plot one-number metrics year by year so I could see the bigger picture of a player’s career. That turned into data ingestion, PostgreSQL, server-side queries, player search, interactive charts, and a small forecasting layer.',
    tags: ['Next.js', 'TypeScript', 'Python', 'Supabase', 'PostgreSQL'],
    github: 'https://github.com/jacekasen/nba-peak-analysis',
    demo: '/projects/nba',
  },
  {
    title: 'FinSight',
    eyebrow: 'Made for a software engineering course',
    kind: 'coursework',
    description:
      'A cross-platform budgeting app with authentication, transaction tracking, financial goals, dashboards, and social accountability features.',
    buildDetails:
      'I worked on the React Native client, REST API, authentication flow, permissions, and PostgreSQL schema.',
    tags: ['React Native', 'TypeScript', 'Node.js', 'PostgreSQL'],
    github: null,
    demo: null,
  },
  {
    title: 'Decoding Wrist EMG to Text',
    eyebrow: 'Made for a machine learning course',
    kind: 'coursework',
    description:
      'A sequence-modeling project that translates wrist-muscle signals into typed text.',
    buildDetails:
      'Built a shared preprocessing and evaluation pipeline, compared several architectures, and analyzed where each approach struggled.',
    tags: ['Python', 'PyTorch', 'Sequence Models', 'CTC'],
    github: 'https://github.com/jacekasen/ece-c147a-project-submission',
    demo: '/blog/2026-03-20-emg-to-text-decoding',
  },
  {
    title: 'Heavy-Duty Vehicle Site Selection',
    eyebrow: 'Made for a computer vision course',
    kind: 'coursework',
    description:
      'A computer-vision workflow for identifying heavy-duty vehicles in aerial imagery and mapping likely charging demand.',
    buildDetails:
      'Built image tiling, annotation conversion, model training, inference, and mapping steps into one working pipeline.',
    tags: ['Python', 'PyTorch', 'Computer Vision', 'Geospatial'],
    github: null,
    demo: '/blog/2025-12-13-team41-truckdetection',
  },
];
