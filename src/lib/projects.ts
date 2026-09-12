export interface Project {
  title: string;
  eyebrow: string;
  kind: 'independent' | 'coursework';
  description: string;
  buildDetails: string;
  tags: string[];
  github: string | null;
  demo: string | null;
  video?: string | null;
  /** Shown beside a featured project as the short "what is in there" list. */
  highlights?: string[];
}

export const projects: Project[] = [
  {
    title: 'Counter-Strike 2 Analysis',
    eyebrow: 'Map-to-map professional telemetry',
    kind: 'independent',
    description:
      'An automated pipeline discovering, harvesting, extracting, and analyzing professional CS2 match demos and HLTV telemetry across all 65 concluded MVP tournaments since the launch of CS2. Features interactive map-to-map performance tracking with rolling window smoothing on HLTV Rating 3.0.',
    buildDetails:
      'Python pipelines parse Source 2 demo events and HLTV boxscores, synchronizing to a Supabase PostgreSQL backend. The Next.js dashboard uses server-side data fetching, Canvas visualization, map pool filtering, and moving average smoothing to analyze player form and variance.',
    tags: ['Next.js', 'TypeScript', 'Python', 'Supabase', 'PostgreSQL', 'Canvas'],
    github: 'https://github.com/jacekasen/cs2',
    demo: '/projects/cs2',
    highlights: [
      'Chronological map-to-map HLTV Rating 3.0 curves',
      'Configurable rolling window smoothing (5–20 maps)',
      'Map-specific filters for competitive pool analysis',
      '40,000+ map boxscores across 65 Tier-1 tournaments',
    ],
  },
  {
    title: 'NBA Performance Analysis',
    eyebrow: 'A project I started for fun',
    kind: 'independent',
    description:
      'I have followed the NBA closely since 2019 and kept wondering when players usually peak. I collected the data to investigate it myself, then expanded the project to cover individual careers, league-wide patterns, next-season forecasts and salaries across different cap eras.',
    buildDetails:
      'Python pipelines clean the performance, prediction and salary data and publish it to Supabase. The Next.js site uses server-side queries, cached aggregates and API routes to power player search, interactive career and peak-age charts, forecasts, payroll breakdowns and cross-era salary comparisons.',
    tags: ['Next.js', 'TypeScript', 'Python', 'Supabase', 'PostgreSQL'],
    github: 'https://github.com/jacekasen/nba-peak-analysis',
    demo: '/projects/nba',
    highlights: [
      'Career charts across five advanced metrics',
      'Next-season forecasts with observed results',
      'League-wide peak-age analysis',
      'Team payrolls, player salaries and cap-share rankings',
    ],
  },
  {
    title: 'Flight Tracker',
    eyebrow: 'A personal alternative inspired by Flighty',
    kind: 'independent',
    description:
      'I liked how Flighty showed upcoming flights and travel history on a globe, but its recurring subscription prompts got too annoying. So I built a similar app for myself, with flight lookup, a private history, a route map and a yearly recap.',
    buildDetails:
      'The app is built with Expo and Supabase. A Supabase Edge Function keeps the flight-data API key off the client, cleans up provider responses, caches results and limits requests. Row-level security keeps each user’s saved flights private, with database tests covering that access.',
    tags: ['Expo', 'React Native', 'TypeScript', 'Supabase', 'PostgreSQL', 'Deno'],
    github: 'https://github.com/jacekasen/flight-tracker',
    demo: '/projects/flight-tracker',
    video: 'https://youtu.be/ZIx8ffsGgGk',
    highlights: [
      'Flight lookup and manual entry',
      'A globe showing saved routes',
      'Private histories enforced by the database',
      'Flight times shown in each airport’s time zone',
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
    github: 'https://github.com/jacekasen/cs130-finsight-public',
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
