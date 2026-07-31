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

To enable the NBA Peak Analysis page, replace the placeholders in `.env.local` with the project
URL and publishable key from the Supabase Connect panel. The database must contain a publicly
readable `nba_player_seasons` table.

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

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (fonts, Shell wrapper)
│   ├── page.tsx            # Home page (hero + recent posts)
│   ├── about/page.tsx      # About page
│   ├── blog/
│   │   ├── page.tsx        # Blog index
│   │   └── [slug]/page.tsx # Individual post
│   └── projects/page.tsx   # Projects showcase
├── components/
│   └── Shell.tsx           # Sidebar navigation shell
└── lib/
    ├── config.ts           # Site-wide constants (social links, etc.)
    ├── posts.ts            # Markdown/blog post utilities
    ├── supabase.ts         # Supabase database client
    └── utils.ts            # Shared helpers (cn, etc.)

content/
├── posts/                  # Blog posts as .md files
│   └── *.md                # Frontmatter: title, date, description, tags
└── about.md                # About page content
```

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
