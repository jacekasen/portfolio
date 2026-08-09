# Portfolio — Jace Kasen

A personal portfolio and blog built with Next.js, featuring markdown-powered content, a responsive top navigation layout, and a warm earthy design system with dark mode support.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 with CSS custom properties for theming
- **Content:** Markdown files processed with gray-matter and remark
- **Fonts:** PT Serif (body) + JetBrains Mono (code/headings)
- **Testing:** Vitest + Testing Library
- **Formatting:** Prettier with Tailwind CSS plugin

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

The site will be available at `http://localhost:3000`.

To enable the NBA pages, replace the placeholders in `.env.local` with the project URL and
publishable key from the Supabase Connect panel. No other environment variables are needed, and the
service-role key must never be added here — every query runs through the publishable key only.

| Page                          | Route                              | Supabase tables                                          |
| ----------------------------- | ---------------------------------- | -------------------------------------------------------- |
| NBA Performance Trends        | `/projects/nba/performance-trends` | `nba_player_seasons`, `player_predictions`               |
| NBA Peak Performance Analysis | `/projects/nba/peak-performance`   | `nba_player_seasons`                                     |
| NBA Salary Cap Explorer       | `/projects/nba/salaries`           | `player_salaries`, `salary_caps`, `team_season_salaries` |

All of these tables must be publicly readable (the `anon` role needs `select`).

## NBA Salary Cap Explorer

`/projects/nba/salaries` explores NBA salaries as a share of the salary cap, because nominal dollars
are not comparable across eras:

```text
cap share = salary / salary cap × 100
```

The page is populated by the salary pipeline in the [Board Man Gets Paid](https://github.com/jacekasen/nba)
analysis repository (`salary/`), which publishes `player_salaries`, `salary_caps`, and
`team_season_salaries`. The frontend never scrapes Basketball Reference; it only reads those tables.

Visualizations:

- **Team payroll against the cap** — every contract stacked into one bar, with a 100% marker that
  payroll is allowed to pass.
- **Roster bars** — one horizontal bar per salary record, sorted by cap share (or by nominal salary
  with the measure toggle).
- **Donut** — team payroll composition. Segments are `team_payroll_share` (salary ÷ known team
  payroll), never cap share, and the view disables itself when a team-season is too thinly covered
  to be a whole.
- **Player history** — a career cap share line for the selected player, drawing every team record in
  seasons split across teams.
- **Cap share leaders** — a cross-era leaderboard, filterable by season.

Team and season live in the URL, so a view is shareable:
`/projects/nba/salaries?team=LAC&season=2024-25&player=leonaka01` (plus optional `view=donut` and
`measure=salary`).

Queries are scoped per view through `/api/nba/salaries/*`: the season/team inventory, then one
team-season, and player history or leaderboard rows only when asked for. The full salary history is
never shipped to the browser. Records with no salary amount are shown as _not recorded_ and left out
of every total rather than counted as zero.

## Scripts

| Command                | Description                      |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Start development server         |
| `npm run build`        | Production build                 |
| `npm run start`        | Serve production build           |
| `npm run lint`         | Run ESLint                       |
| `npm run test`         | Run tests with Vitest            |
| `npm run format`       | Format code with Prettier        |
| `npm run format:check` | Check formatting without writing |

## Project Structure

Site-wide code sits at the top of `components/` and `lib/`; anything that only serves one project
lives in a folder named for it (today, `nba/`).

```
src/
├── app/                        # Routes only — App Router pages and handlers
│   ├── layout.tsx              # Root layout (fonts, Shell wrapper)
│   ├── page.tsx                # Home page (hero + recent posts)
│   ├── about/page.tsx          # About page
│   ├── blog/
│   │   ├── page.tsx            # Blog index
│   │   └── [slug]/page.tsx     # Individual post
│   ├── projects/nba/           # NBA analyses (trends, peak performance, salaries)
│   └── api/nba/                # Server-side Supabase queries for the NBA pages
├── components/
│   ├── Shell.tsx               # Site navigation shell
│   └── nba/                    # NBA analysis UI
│       ├── MetricChart.tsx     # Career metric chart (performance trends)
│       ├── PlayerAutocomplete.tsx
│       ├── PlayerPredictionCard.tsx
│       ├── PeakPerformanceDashboard.tsx
│       └── salary/             # Salary cap explorer (bars, donut, history, leaderboard)
└── lib/
    ├── config.ts               # Site-wide constants (social links, etc.)
    ├── posts.ts                # Markdown/blog post utilities
    ├── projects.ts             # Project showcase content
    ├── supabase.ts             # Supabase database client
    ├── utils.ts                # Shared helpers (cn, etc.)
    └── nba/
        ├── peak-performance.ts # Peak-age aggregation
        ├── salaries.ts         # Salary table queries (player_salaries, salary_caps, …)
        ├── salary-format.ts    # Cap share / payroll share formatting and derivations
        └── teams.ts            # Franchise abbreviation → full team name

content/
├── posts/                      # Blog posts as .md files
│   └── *.md                    # Frontmatter: title, date, description, tags
└── about.md                    # About page content
```

Conventions:

- Tests sit next to the code they cover (`salaries.ts` / `salaries.test.ts`).
- `PascalCase.tsx` exports one main component; `kebab-case.ts` is a module of helpers.
- Imports use the `@/` alias, never deep relative paths across folders.
- Images referenced by posts belong in `public/images/`, not in `content/`.

## Adding Content

### Blog posts

Create a new `.md` file in `content/posts/`:

```markdown
---
title: 'My Post Title'
date: '2026-01-15'
description: 'A short summary of the post.'
tags: [tag1, tag2]
---

Post content in markdown...
```

The post will automatically appear on the blog index and home page.

### About page

Edit `content/about.md` directly.

## License

Jace Kasen. All rights reserved.
