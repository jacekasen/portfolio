import Link from 'next/link';
import { Github, Maximize2, Plane } from 'lucide-react';

export const metadata = {
  title: 'Flight Tracker | Jace Kasen',
  description:
    'A private flight diary built with Expo and Supabase, running live in the page as a read-only sample history.',
};

const architecture = [
  {
    title: 'The provider never touches the client',
    body: 'A Supabase Edge Function holds the AeroDataBox key, validates the session, and normalizes whatever the provider returns into a contract the app owns. Coverage is uneven and the free tier is small, so it also caches normalized results for fifteen minutes and enforces per-user and per-IP limits that survive restarts. IP addresses are hashed before they are ever stored.',
  },
  {
    title: 'Privacy is enforced by the database',
    body: 'Every saved flight is protected by row-level security, so isolation does not depend on the client asking the right question. A pgTAP suite proves it: cross-user reads, writes, updates, and deletes all fail, the provider cache and rate-limit machinery are unreachable from any user session, and deleting an account really does cascade.',
  },
  {
    title: 'Times belong to airports, not to your phone',
    body: 'Everything is stored in UTC and displayed in each airport’s local time, which is the only way a red-eye reads correctly on both ends. Airport coordinates and countries come from the public OurAirports dataset and are filled in by a database trigger, which is also what makes distance totals and the route map work.',
  },
  {
    title: 'It works when the data does not',
    body: 'Provider records arrive partial more often than not, so a missing aircraft, distance, or airport match never removes a flight from unrelated totals. When a lookup fails entirely, manual entry saves the same record without any provider request at all.',
  },
];

export default function FlightTrackerPage() {
  return (
    <div className="space-y-14 pt-4 md:pt-8">
      <header className="max-w-4xl">
        <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">
          A mobile app I built end to end
        </p>
        <h1 className="mb-4 font-mono text-4xl tracking-tight md:text-6xl">Flight Tracker</h1>
        <p className="text-muted max-w-3xl text-lg leading-8">
          Airlines forget you flew with them, and the apps that remember want your whole trip
          history in exchange. This is the other version: a private flight diary that looks a flight
          up by number, keeps the ones you actually took, and turns them into a recap that belongs
          to you.
        </p>
      </header>

      <section aria-labelledby="demo-heading" className="space-y-6">
        <div className="border-border/80 flex flex-wrap items-end justify-between gap-4 border-b pb-4">
          <div>
            <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">
              Live demo
            </p>
            <h2 id="demo-heading" className="text-3xl font-bold tracking-tight md:text-4xl">
              The actual app, running here
            </h2>
          </div>
          <a
            href="/flight-tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="border-border hover:border-accent hover:text-accent inline-flex items-center gap-2 rounded-sm border px-4 py-2.5 font-mono text-xs transition-colors"
          >
            <Maximize2 size={14} /> Open full screen
          </a>
        </div>

        <p className="text-muted max-w-3xl leading-7">
          This is the same Expo build that runs on a phone, exported for the web and pointed at a
          sample account. Browse the timeline, open a flight, and look at the insights. It is
          read-only on purpose: saving, editing, and deleting all require an account, and no
          password is published here to get one.
        </p>

        <div className="bg-ink flex justify-center px-4 py-10 md:py-14">
          <div className="w-full max-w-[375px]">
            <div className="rounded-[2.5rem] bg-[#1c1c1e] p-3 shadow-2xl">
              <div className="relative overflow-hidden rounded-[2rem] bg-black">
                <iframe
                  src="/flight-tracker"
                  title="Flight Tracker demo application"
                  loading="lazy"
                  className="block h-[812px] w-full border-0"
                />
              </div>
            </div>
            <p className="text-on-ink-muted mt-5 text-center font-mono text-[0.68rem] tracking-[0.1em] uppercase">
              Expo web build · read-only sample account
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="build-heading" className="space-y-6">
        <div className="border-border/80 border-b pb-4">
          <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">
            How it is built
          </p>
          <h2 id="build-heading" className="text-3xl font-bold tracking-tight md:text-4xl">
            The interesting parts are not on screen
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
