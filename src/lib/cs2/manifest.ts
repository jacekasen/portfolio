import fs from 'fs/promises';
import path from 'path';
import type { RadarManifest } from '@/lib/cs2/radar';

export async function getRadarManifest(): Promise<RadarManifest | null> {
  try {
    const filePath = path.join(process.cwd(), 'public/data/cs2/radar/manifest.json');
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as RadarManifest;
  } catch (err) {
    console.error('Failed to load radar manifest:', err);
    return null;
  }
}
