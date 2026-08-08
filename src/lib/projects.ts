export interface Project {
  title: string;
  description: string;
  tags: string[];
  github: string | null;
  demo: string | null;
}

export const projects: Project[] = [
  {
    title: 'NBA Analysis',
    description:
      'Interactive analyses of individual NBA career trends and league-wide peak performance using Basketball Reference data.',
    tags: ['Python', 'Pandas', 'Supabase', 'PostgreSQL', 'Next.js'],
    github: 'https://github.com/jacekasen/nba-peak-analysis',
    demo: '/projects/nba',
  },
  {
    title: 'Decoding Wrist EMG to Text',
    description:
      'Compared sequence models for decoding typed text from wrist EMG signals. A bidirectional LSTM beat the TDS convolution baseline, a GRU, a ResNet18 + LSTM hybrid, and a Transformer encoder, cutting test character error rate from 24.18% to 18.95%.',
    tags: ['Python', 'PyTorch', 'Deep Learning', 'LSTM', 'Transformers', 'CTC'],
    github: 'https://github.com/jacekasen/ece-c147a-project-submission',
    demo: '/blog/2026-03-20-emg-to-text-decoding',
  },
  {
    title: 'MD/HD Vehicle Detection via Satellite Imagery',
    description:
      'Fine-tuned a Faster R-CNN (ResNet50-FPN) on the DOTA aerial dataset to detect medium and heavy-duty trucks in Google Maps satellite tiles. Generated a vehicle density heat map over the UCLA campus area to inform EV charging infrastructure planning.',
    tags: ['Python', 'PyTorch', 'Computer Vision', 'ResNet50', 'FPN', 'Google Maps API'],
    github: null,
    demo: '/blog/2025-12-13-team41-truckdetection',
  },
  {
    title: 'This Portfolio Website',
    description:
      'Portfolio and blog built with Next.js, Tailwind CSS, and Markdown, developed using Cursor IDE.',
    tags: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Vercel'],
    github: 'https://github.com/jankasen/portfolio',
    demo: null,
  },
];
