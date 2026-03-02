import { searchAll } from "@/actions/search.action";
import { SearchResultsClient } from "./SearchResultsClient";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  return {
    title: q ? `Search: ${q}` : "Search",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await searchAll(query) : { users: [], posts: [] };

  return <SearchResultsClient query={query} initialResults={results} />;
}