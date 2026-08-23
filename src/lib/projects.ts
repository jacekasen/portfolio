export interface Project {
  title: string;
  eyebrow: string;
  kind: 'independent' | 'coursework';
  description: string;
  buildDetails: string;
  tags: string[];
  github: string | null;
  demo: string | null;
  /** Shown beside a featured project as the short "what is in there" list. */
  highlights?: string[];
}

export const projects: Project[] = [
  {
    title: 'NBA Performance Analysis',
    eyebrow: 'A project I started for fun',
    kind: 'independent',
    description:
      'I have followed the NBA closely since 2019, and the answer to the question of when players peak has been loosey goosey to me, or whether a developing player will keep getting better or are they still two years away from being two years away comes up often. I could have looked up the usual answer, but I wanted to investigate it myself for fun.',
    buildDetails:
      "I also wanted to plot one-number metrics year by year so I could see the bigger picture of a player’s career. Stats are widely available but visualizations aren't. That turned into data ingestion, PostgreSQL, server-side queries, player search, interactive charts, and a small forecasting layer.",
    tags: ['Next.js', 'TypeScript', 'Python', 'Supabase', 'PostgreSQL'],
    github: 'https://github.com/jacekasen/nba-peak-analysis',
    demo: '/projects/nba',
    highlights: [
      'Player search and dynamic routes',
      'Server-backed PostgreSQL queries',
      'Interactive career and peak dashboards',
      'Prediction and comparison features',
    ],
  },
  {
    title: 'Flight Tracker',
    eyebrow: 'A mobile app I built end to end',
    kind: 'independent',
    description:
      'Airlines forget you flew with them, and the apps that do remember want your whole trip history in exchange. I wanted a private flight diary instead: look up a flight by number, keep the ones I actually took, and get a recap at the end of the year that belongs to me.',
    buildDetails:
      'It is an Expo app on Supabase, and most of the work was in the parts nobody sees. Flight data providers are patchy and rate-limited, so a Supabase Edge Function owns the provider key, normalizes whatever comes back into a contract the app controls, caches it, and enforces per-user limits. Every saved flight is protected by row-level security, with the isolation proven by database tests rather than assumed.',
    tags: ['Expo', 'React Native', 'TypeScript', 'Supabase', 'PostgreSQL', 'Deno'],
    github: 'https://github.com/jacekasen/flight-tracker',
    demo: '/projects/flight-tracker',
    highlights: [
      'The real app, running in the page',
      'Edge Function proxy with caching and rate limits',
      'Row-level security proven by database tests',
      'UTC storage with airport-local display',
    ],
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
