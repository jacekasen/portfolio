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
    title: 'Professional Counter-Strike 2 Analysis Pipeline',
    eyebrow: 'Map-to-map professional telemetry',
    kind: 'independent',
    description:
      'An automated pipeline that harvests and analyzes professional CS2 match demos across 65 Tier-1 tournaments, with interactive map-to-map performance tracking.',
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
    title: 'NBA Player Analytics Toolset',
    eyebrow: 'Career trajectory forecasting and salary analytics',
    kind: 'independent',
    description:
      'An NBA player analytics toolset: a leakage-safe ML pipeline forecasting career trajectories, plus a separate salary and cap-share analysis system.',
    buildDetails:
      'A leakage-safe ML pipeline uses chronological splits and a continuation model to correct for survivorship bias, producing exit-risk-adjusted next-season BPM forecasts. A separate pipeline scrapes and validates historical salaries into cap-share metrics across eras. Both publish to Supabase, powering a Next.js dashboard for player search, career and peak-age charts, forecasts, and salary comparisons.',
    tags: ['Next.js', 'TypeScript', 'Python', 'Machine Learning', 'Supabase', 'PostgreSQL'],
    github: 'https://github.com/jacekasen/nba',
    demo: '/projects/nba',
    highlights: [
      'Leakage-safe, chronologically-validated career forecasts',
      'Survivorship-bias-corrected player trajectory model',
      'Historical salary and cap-share analysis, 1984–present',
      'Interactive career, peak-age, and payroll dashboards',
    ],
  },
  {
    title: 'Flight Tracker Mobile App',
    eyebrow: 'Secure, cross-platform flight history tracking',
    kind: 'independent',
    description:
      'A cross-platform flight-history app with authenticated Edge Function lookups, per-user rate limiting, and row-level security isolating each user’s data.',
    buildDetails:
      'A Supabase Edge Function validates the user’s session before proxying AeroDataBox lookups, applying persistent per-user and HMAC-hashed-IP rate limits with fifteen-minute result caching. Postgres row-level security isolates every user’s flights, with cascading deletion on account removal. The app parses alphanumeric flight numbers, stores UTC times with airport-local display, and renders all-time routes using native maps on iOS and Android and a custom globe renderer on web. Unit tests, Edge Function HTTP tests, and pgTAP database authorization tests run in continuous integration.',
    tags: ['Expo', 'React Native', 'TypeScript', 'Supabase', 'PostgreSQL', 'Deno'],
    github: 'https://github.com/jacekasen/flight-tracker',
    demo: '/projects/flight-tracker',
    video: 'https://youtu.be/ZIx8ffsGgGk',
    highlights: [
      'Authenticated Edge Function with per-user and IP-hashed rate limiting',
      'Row-level security with cascading account deletion',
      'Native maps on iOS/Android plus a custom globe renderer on web',
      'Unit, Edge Function, and database authorization tests in CI',
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
    tags: ['React Native', 'TypeScript', 'Node.js', 'PostgreSQL', 'Supabase'],
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
    tags: ['Python', 'PyTorch', 'Sequence Models', 'CTC', 'Deep Learning'],
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
    tags: ['Python', 'PyTorch', 'Computer Vision', 'Geospatial', 'Object Detection'],
    github: null,
    demo: '/blog/2025-12-13-team41-truckdetection',
  },
];
