import { redirect } from "next/navigation";

// This page has been replaced by /consent/[token]/approve
// Redirect any old links gracefully
export default async function ApproveAccountPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (token) redirect(`/consent/${token}/approve`);
  redirect("/login");
}
