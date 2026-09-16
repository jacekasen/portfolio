import { redirect } from 'next/navigation';

type PageProps = {
  searchParams: Promise<{
    player?: string;
  }>;
};

export default async function Cs2MapToMapRedirect({ searchParams }: PageProps) {
  const { player } = await searchParams;
  const query = player ? `?player=${encodeURIComponent(player)}` : '';
  redirect(`/projects/cs2/trends${query}`);
}
