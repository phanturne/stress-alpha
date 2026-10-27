import { redirect } from "next/navigation";

export default async function WatchlistPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = searchParams ? await searchParams : {};
  const query = new URLSearchParams();
  query.set("mode", "watchlist");
  for (const [key, val] of Object.entries(params)) {
    if (typeof val === "string" && key !== "mode") {
      query.set(key, val);
    }
  }
  redirect(`/?${query.toString()}`);
}
