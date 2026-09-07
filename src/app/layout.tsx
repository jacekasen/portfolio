import type { Metadata } from 'next';
import { PT_Serif, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Shell from '@/components/Shell';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const ptSerif = PT_Serif({
  variable: '--font-pt-serif',
  weight: ['400', '700'],
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Jace Kasen · Software Engineer',
    template: '%s · Jace Kasen',
  },
  description:
    'Jace Kasen builds software, follows basketball too closely, and writes about language and identity.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ptSerif.variable} ${jetbrainsMono.variable} font-serif antialiased`}>
        <Shell>{children}</Shell>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
