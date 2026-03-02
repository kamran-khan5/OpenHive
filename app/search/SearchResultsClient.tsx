"use client";

import { searchAll } from "@/actions/search.action";
import { toggleFollow } from "@/actions/user.action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import {
  FileTextIcon,
  HeartIcon,
  MessageCircleIcon,
  SearchIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";

type SearchResults = Awaited<ReturnType<typeof searchAll>>;

interface SearchResultsClientProps {
  query: string;
  initialResults: SearchResults;
}

function UserCard({
  user,
}: {
  user: SearchResults["users"][number];
}) {
  const { user: currentUser } = useUser();
  const [isFollowing, setIsFollowing] = useState(user.isFollowing ?? false);
  const [isLoading, setIsLoading] = useState(false);

  const isOwnProfile =
    currentUser?.username === user.username ||
    currentUser?.emailAddresses[0]?.emailAddress.split("@")[0] === user.username;

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentUser || isOwnProfile) return;
    const prev = isFollowing;
    setIsFollowing((p) => !p);
    setIsLoading(true);
    try {
      const result = await toggleFollow(user.id);
      if (!result?.success) {
        setIsFollowing(prev);
        toast.error("Failed to update follow status");
      } else {
        toast.success(prev ? "Unfollowed" : "Now following");
      }
    } catch {
      setIsFollowing(prev);
      toast.error("Failed to update follow status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link
      href={`/profile/${user.username}`}
      className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border/60 hover:border-border hover:bg-muted/30 transition-all duration-150"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="size-11 shrink-0">
          <AvatarImage src={user.image ?? "/avatar.png"} />
          <AvatarFallback className="text-sm bg-muted font-medium">
            {user.name?.[0] ?? user.username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">
            {user.name ?? user.username}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            @{user.username}
          </p>
          {user.bio && (
            <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-xs">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-muted-foreground hidden sm:block">
          {user._count.followers.toLocaleString()} followers
        </span>
        {currentUser && !isOwnProfile && (
          <Button
            size="sm"
            variant={isFollowing ? "outline" : "default"}
            onClick={handleFollow}
            disabled={isLoading}
            className="min-w-20"
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </Button>
        )}
      </div>
    </Link>
  );
}

function PostCard({ post }: { post: SearchResults["posts"][number] }) {
  return (
    <Link
      href={`/`}
      className="block p-4 rounded-xl border border-border/60 hover:border-border hover:bg-muted/30 transition-all duration-150"
    >
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="size-7 shrink-0">
          <AvatarImage src={post.author.image ?? ""} />
          <AvatarFallback className="text-xs bg-muted">
            {post.author.name?.[0] ?? "U"}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{post.author.name}</span>
        <span className="text-xs text-muted-foreground">
          @{post.author.username}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          {formatDistanceToNow(new Date(post.createdAt))} ago
        </span>
      </div>

      {post.content && (
        <p className="text-sm text-foreground/90 line-clamp-3 leading-relaxed">
          {post.content}
        </p>
      )}

      {post.articleTitle && (
        <p className="text-sm font-medium text-primary mt-1 line-clamp-1">
          {post.articleTitle}
        </p>
      )}

      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <HeartIcon className="size-3.5" />
          {post._count.likes}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircleIcon className="size-3.5" />
          {post._count.comments}
        </span>
      </div>
    </Link>
  );
}

export function SearchResultsClient({
  query: initialQuery,
  initialResults,
}: SearchResultsClientProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [results, setResults] = useState(initialResults);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    startTransition(async () => {
      const data = await searchAll(q);
      setResults(data);
    });
  };

  const totalResults = results.users.length + results.posts.length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Search input */}
      <form onSubmit={handleSearch} className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search users, posts…"
          className="pl-10 h-11 text-sm"
          autoFocus
        />
      </form>

      {/* Results */}
      {initialQuery && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isPending ? (
                "Searching…"
              ) : totalResults > 0 ? (
                <>
                  <span className="font-medium text-foreground">
                    {totalResults}
                  </span>{" "}
                  results for{" "}
                  <span className="font-medium text-foreground">
                    &ldquo;{initialQuery}&rdquo;
                  </span>
                </>
              ) : (
                <>
                  No results for{" "}
                  <span className="font-medium text-foreground">
                    &ldquo;{initialQuery}&rdquo;
                  </span>
                </>
              )}
            </p>
          </div>

          {totalResults > 0 && (
            <Tabs defaultValue={results.users.length > 0 ? "users" : "posts"}>
              <TabsList className="w-full border-b rounded-none h-auto p-0 bg-transparent justify-start">
                <TabsTrigger
                  value="users"
                  className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 font-semibold"
                >
                  <UserIcon className="size-4" />
                  People
                  {results.users.length > 0 && (
                    <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                      {results.users.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="posts"
                  className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 font-semibold"
                >
                  <FileTextIcon className="size-4" />
                  Posts
                  {results.posts.length > 0 && (
                    <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                      {results.posts.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-4 space-y-3">
                {results.users.length > 0 ? (
                  results.users.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No users found
                  </p>
                )}
              </TabsContent>

              <TabsContent value="posts" className="mt-4 space-y-3">
                {results.posts.length > 0 ? (
                  results.posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No posts found
                  </p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </>
      )}

      {!initialQuery && (
        <div className="text-center py-16 text-muted-foreground">
          <SearchIcon className="size-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">Search for people or posts</p>
        </div>
      )}
    </div>
  );
}