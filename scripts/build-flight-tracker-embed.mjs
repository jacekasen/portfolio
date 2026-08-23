/**
 * Rebuilds the Flight Tracker demo that /projects/flight-tracker embeds.
 *
 * The demo is a static Expo web export committed under public/flight-tracker,
 * so the portfolio can be deployed without a second hosting target. Re-run this
 * whenever the app changes:
 *
 *   npm run embed:flight-tracker
 *
 * Point it at a checkout somewhere else with FLIGHT_TRACKER_DIR=../elsewhere.
 */
import { execFileSync } from 'node:child_process';
import { cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const APP_DIR = fileURLToPath(
  new URL(process.env.FLIGHT_TRACKER_DIR ?? '../../flight-tracker', import.meta.url),
);
const STAGING_DIR = `${APP_DIR}/dist-embed`;
const TARGET_DIR = fileURLToPath(new URL('../public/flight-tracker', import.meta.url));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. ' +
      'The demo reads the same project the rest of the site does.',
  );
}

await rm(STAGING_DIR, { recursive: true, force: true });

execFileSync(
  'npx',
  ['expo', 'export', '--platform', 'web', '--output-dir', 'dist-embed', '--clear'],
  {
    cwd: APP_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      // The app's own .env.local would otherwise win over these and the bundle
      // would quietly point at whatever project that file names.
      EXPO_NO_DOTENV: '1',
      // Without a base URL the export asks for its assets at /_expo/..., which
      // 404s when it is served from a subdirectory.
      EXPO_WEB_BASE_URL: '/flight-tracker',
      // Opens the read-only screens to signed-out visitors. What they can
      // actually read is decided by the database's demo_accounts policy.
      EXPO_PUBLIC_DEMO: '1',
      EXPO_PUBLIC_SUPABASE_URL: supabaseUrl,
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabaseKey,
    },
  },
);

await rm(TARGET_DIR, { recursive: true, force: true });
await cp(STAGING_DIR, TARGET_DIR, { recursive: true });
await rm(STAGING_DIR, { recursive: true, force: true });

console.log(
  `\nWrote the demo to public/flight-tracker (pointing at ${new URL(supabaseUrl).hostname}).`,
);
console.log('Run `npm run build` afterwards: Next snapshots /public at build time.');
