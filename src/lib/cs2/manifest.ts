import fs from 'fs/promises';
import path from 'path';
import type { RadarManifest } from '@/lib/cs2/radar';

let cachedManifest: RadarManifest | null = null;

export async function getRadarManifest(): Promise<RadarManifest | null> {
  if (cachedManifest) return cachedManifest;

  try {
    const filePath = path.join(process.cwd(), 'public/data/cs2/radar/manifest.json');
    const content = await fs.readFile(filePath, 'utf-8');
    cachedManifest = JSON.parse(content) as RadarManifest;
    return cachedManifest;
  } catch (err) {
    console.error('Failed to load radar manifest:', err);
    return null;
  }
}
