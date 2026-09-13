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
    title: 'Counter-Strike 2 Analytics & ETL Pipeline',
    eyebrow: 'Automated ETL pipeline & 2D radar spatial analytics',
    kind: 'independent',
    description:
      'An automated ETL pipeline and interactive Next.js platform ingesting 1,787 matches across 65 tournaments, reducing >380 GB of raw match replays into a compact 472 MB partitioned Parquet datastore.',
    buildDetails:
      'Engineered an automated ETL pipeline ingesting 1,787 matches across 65 tournaments, reducing >380 GB of raw match replays into a compact 472 MB partitioned Parquet datastore (>99.8% storage reduction). Extracted and normalized 598,000+ combat events using Polars, computing 2D radar spatial projections and implementing 3-second sliding-window algorithms for trade-kill attribution. Built a resilient ingestion crawler with browser TLS impersonation, request jitter, circuit-breaker error handling, and SQLite WAL mode to track match processing state. Shipped an interactive Next.js dashboard featuring server-rendered tournament analytics, Canvas-based player form curves, and rating comparisons.',
    tags: ['Python', 'Polars', 'Next.js', 'Snappy Parquet', 'SQLite', 'Supabase'],
    github: 'https://github.com/jacekasen/cs2',
    demo: '/projects/cs2',
    highlights: [
      'Automated ETL pipeline ingesting 1,787 matches across 65 tournaments (>99.8% storage reduction)',
      '598,000+ combat events with 2D radar projections and 3-second trade attribution',
      'Resilient ingestion crawler with browser TLS impersonation and SQLite WAL tracking',
      'Server-rendered tournament analytics, Canvas player form curves, and rating comparisons',
    ],
  },
  {
    title: 'Flight Tracker Mobile App',
    eyebrow: 'Cross-platform flight history & edge-secured API',
    kind: 'independent',
    description:
      'A cross-platform flight-history app for iOS, Android, and web with authenticated search, private travel history, and custom route maps with yearly recaps.',
    buildDetails:
      'Secured flight lookups behind a Supabase Edge Function with JWT validation, persistent HMAC-hashed IP and per-user rate limits, and 15-minute cached provider responses. Enforced Postgres Row-Level Security with cascading account deletion, normalized data against a 4,134-airport dataset, and calculated Great Circle flight distances. Automated CI/CD workflows using GitHub Actions to run 35 Vitest unit tests, Edge Function HTTP tests, and database authorization assertions with pgTAP.',
    tags: ['Expo', 'React Native', 'TypeScript', 'PostgreSQL', 'Supabase', 'Deno'],
    github: 'https://github.com/jacekasen/flight-tracker',
    demo: '/projects/flight-tracker',
    video: 'https://youtu.be/ZIx8ffsGgGk',
    highlights: [
      'Cross-platform app for iOS, Android, and web with authenticated search and yearly recaps',
      'Supabase Edge Function with JWT validation, HMAC-hashed IP, and per-user rate limits',
      'Postgres Row-Level Security with cascading account deletion and 4,134-airport normalization',
      'Automated CI/CD with 35 Vitest unit tests, Edge Function HTTP tests, and pgTAP assertions',
    ],
  },
  {
    title: 'NBA Player Analytics & Salary Cap Explorer',
    eyebrow: 'Career trajectory forecasting & historical cap share analysis',
    kind: 'independent',
    description:
      'A full-stack analytics platform that processes 36,000+ player-season records across 80 seasons, serving interactive career charts, peak-age curves, and forecasts via Next.js and Supabase.',
    buildDetails:
      'Developed a historical salary pipeline normalizing contracts into Cap Share percentages across eras, supporting stacked payroll-against-cap and roster composition visualizations. Built a leakage-safe ML pipeline with strict chronological validation splits (1976–2018 train, 2019–2022 validation, 2023–2024 test), resetting rolling features on non-consecutive seasons. Built an automated prediction service integrating two-stage classification and regression models, correcting for survivorship bias and publishing calibrated career forecasts to Supabase.',
    tags: ['Python', 'Next.js', 'TypeScript', 'PostgreSQL', 'Supabase', 'scikit-learn'],
    github: 'https://github.com/jacekasen/nba',
    demo: '/projects/nba',
    highlights: [
      'Processes 36,000+ player-season records across 80 seasons with interactive dashboards',
      'Historical salary pipeline normalizing contracts into Cap Share percentages across eras',
      'Leakage-safe ML pipeline with strict chronological validation splits (1976–2018, 2019–2022, 2023–2024)',
      'Two-stage classification and regression models correcting for survivorship bias',
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
