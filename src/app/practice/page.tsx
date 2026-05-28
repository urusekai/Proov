import { redirect } from "next/navigation";

export default async function PracticeRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;
  redirect(url ? `/problem-sets/new?url=${encodeURIComponent(url)}` : "/problem-sets/new");
}
