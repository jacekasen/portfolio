import Link from 'next/link';
import { Github, Plane } from 'lucide-react';

export const metadata = {
  title: 'Flight Tracker | Jace Kasen',
  description:
    'A personal Flighty-inspired flight diary built with Expo, React Native, and Supabase.',
};

const architecture = [
  {
    title: 'Keeping API requests off the client',
    body: 'A Supabase Edge Function stores the AeroDataBox key, checks the user’s session and turns the response into a consistent format for the app. Since coverage varies and the free tier is limited, results are cached for fifteen minutes and requests are limited by user and IP. IP addresses are hashed before they are stored.',
  },
  {
    title: 'Keeping flight history private',
    body: 'Supabase row-level security makes sure each user can only access their own saved flights. I added pgTAP tests for cross-user reads, writes, updates and deletes, as well as checks that the provider cache and rate-limit tables cannot be accessed from a user session. Deleting an account also deletes its flight history.',
  },
  {
    title: 'Handling local flight times',
    body: 'Flight times are stored in UTC and displayed in each airport’s local time, so overnight flights show the right time at both ends. Airport coordinates and countries come from the public OurAirports dataset and are added by a database trigger. That data is also used for distance totals and the route map.',
  },
  {
    title: 'Working around incomplete data',
    body: 'Flight records are often missing an aircraft, distance or airport match, so the app calculates each stat independently instead of dropping the whole flight. If a lookup fails completely, I can enter the flight manually and save the same kind of record.',
  },
];

export default function FlightTrackerPage() {
  return (
    <div className="space-y-14 pt-4 md:pt-8">
      <header className="max-w-4xl">
        <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">
          A personal alternative inspired by Flighty
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl">Flight Tracker</h1>
        <p className="text-muted max-w-3xl text-lg leading-8">
          I liked how the iOS app Flighty visualized your upcoming flights and travel history on a
          globe, but its recurring subscription prompts got too annoying. So I built a similar app
          for myself. I wanted to look up a flight, keep a private history and see every route on a
          globe.
        </p>
      </header>

      <section aria-labelledby="build-heading" className="space-y-6">
        <div className="border-border/80 border-b pb-4">
          <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">
            How it works
          </p>
          <h2 id="build-heading" className="text-3xl font-bold tracking-tight md:text-4xl">
            The things happening behind the scenes
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {architecture.map((item) => (
            <article key={item.title} className="bg-surface flex flex-col gap-3 p-6">
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-muted leading-7">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="stack-heading" className="space-y-5">
        <h2 id="stack-heading" className="sr-only">
          Stack and source
        </h2>
        <div className="on-ink bg-ink text-on-ink flex flex-col gap-6 p-7 md:flex-row md:items-center md:justify-between md:p-9">
          <div className="flex items-start gap-4">
            <span className="bg-accent text-background w-fit shrink-0 rounded-md p-3">
              <Plane aria-hidden="true" size={22} strokeWidth={1.7} />
            </span>
            <div>
              <p className="mb-2 text-lg leading-7">
                Expo Router and React Native on the client, Supabase Postgres with row-level
                security underneath, and a Deno Edge Function in between.
              </p>
              <p className="text-on-ink-muted font-mono text-xs leading-6">
                Expo · React Native · TypeScript · Supabase · PostgreSQL · Deno · pgTAP · Vitest
              </p>
            </div>
          </div>
          <a
            href="https://github.com/jacekasen/flight-tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-background hover:bg-foreground inline-flex w-fit shrink-0 items-center gap-2 rounded-sm px-5 py-3 font-mono text-sm transition-colors"
          >
            <Github size={16} /> Read the source
          </a>
        </div>
      </section>

      <Link href="/work" className="text-accent inline-block font-mono text-sm hover:underline">
        ← back to all projects
      </Link>
    </div>
  );
}
