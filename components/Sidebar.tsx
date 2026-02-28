import { currentUser } from "@clerk/nextjs/server";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { getUserByClerkId } from "@/actions/user.action";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import {
  MapPinIcon,
  LinkIcon,
  UsersIcon,
  UserCheckIcon,
  FileTextIcon,
  MessageSquareIcon,
  BookmarkIcon,
  SparklesIcon,
} from "lucide-react";

async function Sidebar() {
  const authUser = await currentUser();
  if (!authUser) return <UnAuthenticatedSidebar />;

  const user = await getUserByClerkId(authUser.id);
  if (!user) return null;

  const initials = user.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="sticky top-20 space-y-3">
      {/* ── Main profile card ── */}
      <Card className="px-5 py-5">
        <div className="flex flex-col items-center text-center">
          <Link
            href={`/profile/${user.username}`}
            className="group relative mb-4"
          >
            <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary via-secondary to-primary opacity-40 blur-md group-hover:opacity-70 transition-opacity duration-500" />
            <span className="absolute -inset-0.75 rounded-full border border-dashed border-primary/30 group-hover:border-primary/60 transition-colors duration-300" />
            <Avatar className="relative w-20 h-20 border-2 border-background shadow-xl">
              <AvatarImage
                src={user.image || "/avatar.png"}
                alt={user.name ?? ""}
              />
              <AvatarFallback className="bg-muted text-foreground text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>

          <Link
            href={`/profile/${user.username}`}
            className="group space-y-0.5"
          >
            <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors duration-200">
              {user.name}
            </h3>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </Link>

          {user.bio && (
            <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed line-clamp-3 max-w-45">
              {user.bio}
            </p>
          )}
        </div>

        <div className="my-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="grid grid-cols-2 gap-2">
          <FollowStat
            icon={<UserCheckIcon className="w-3.5 h-3.5" />}
            value={user._count.following}
            label="Following"
          />
          <FollowStat
            icon={<UsersIcon className="w-3.5 h-3.5" />}
            value={user._count.followers}
            label="Followers"
          />
        </div>

        <div className="my-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="space-y-2">
          <MetaRow icon={<MapPinIcon className="w-3.5 h-3.5" />}>
            {user.location || (
              <span className="italic opacity-50">No location</span>
            )}
          </MetaRow>
          <MetaRow icon={<LinkIcon className="w-3.5 h-3.5" />}>
            {user.website ? (
              <a
                href={user.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors duration-200 truncate"
              >
                {user.website.replace(/^https?:\/\//, "")}
              </a>
            ) : (
              <span className="italic opacity-50">No website</span>
            )}
          </MetaRow>
        </div>
      </Card>

      {/* ── Activity card ── */}
      <Card className="px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
          Activity
        </p>
        <div className="space-y-1">
          <ActivityRow
            icon={<FileTextIcon className="w-3.5 h-3.5" />}
            label="Posts"
            value={user._count?.posts ?? 0}
          />
          <ActivityRow
            icon={<MessageSquareIcon className="w-3.5 h-3.5" />}
            label="Comments"
            value={user._count?.comments ?? 0}
          />
          <ActivityRow
            icon={<BookmarkIcon className="w-3.5 h-3.5" />}
            label="Saved"
            value={user._count?.savedPosts ?? 0}
          />
        </div>
      </Card>
    </aside>
  );
}

export default Sidebar;

/* ─── Sub-components ─────────────────────────────────────────── */

function FollowStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="group flex flex-col items-center gap-1 py-2.5 rounded-xl bg-muted/30 hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all duration-200 cursor-default">
      <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors duration-200">
        {icon}
        <span className="text-sm font-bold text-foreground tabular-nums">
          {value.toLocaleString()}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function MetaRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="shrink-0 opacity-60">{icon}</span>
      <span className="truncate">{children}</span>
    </div>
  );
}

function ActivityRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/30 transition-colors duration-150 group">
      <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-150">
        <span className="opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all duration-150">
          {icon}
        </span>
        {label}
      </div>
      <span className="text-xs font-semibold tabular-nums text-foreground/80">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

/* ─── Unauthenticated ────────────────────────────────────────── */

const UnAuthenticatedSidebar = () => (
  <aside className="sticky top-20">
    <Card className="px-5 py-6">
      <div className="flex justify-center mb-4">
        <div className="relative">
          <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 blur-lg" />
          <div className="relative w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <div className="text-center space-y-1 mb-5">
        <h3 className="font-semibold text-sm">Join OpenHive</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Connect, share ideas, and discover people who think like you.
        </p>
      </div>

      <div className="space-y-2">
        <SignUpButton mode="modal">
          <Button
            className="w-full h-9 text-xs font-medium gradient-primary text-white border-0 hover:opacity-90 shadow-md shadow-primary/20 transition-opacity"
            variant="default"
          >
            Get started free
          </Button>
        </SignUpButton>
        <SignInButton mode="modal">
          <Button className="w-full h-9 text-xs font-medium" variant="outline">
            Sign in
          </Button>
        </SignInButton>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <div className="flex -space-x-1.5">
          {[
            "from-indigo-400 to-violet-500",
            "from-violet-400 to-purple-500",
            "from-purple-400 to-pink-500",
          ].map((gradient, i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-full border-[1.5px] border-background bg-gradient-to-br ${gradient}`}
            />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Join thousands of members
        </p>
      </div>
    </Card>
  </aside>
);
