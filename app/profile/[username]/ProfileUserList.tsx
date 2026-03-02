"use client";

import { toggleFollow } from "@/actions/user.action";
import { getUserFollowers, getUserFollowing } from "@/actions/profile.action";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

type Followers = Awaited<ReturnType<typeof getUserFollowers>>;
type Following = Awaited<ReturnType<typeof getUserFollowing>>;

type FollowModalType = "followers" | "following" | null;

interface FollowModalProps {
  open: FollowModalType;
  onClose: () => void;
  followers: Followers;
  following: Following;
}

function UserListItem({
  user,
}: {
  user: Followers[number] | Following[number];
}) {
  const { user: currentUser } = useUser();
  const [isFollowing, setIsFollowing] = useState(user.isFollowing ?? false);
  const [isLoading, setIsLoading] = useState(false);

  const isOwnProfile =
    currentUser?.username === user.username ||
    currentUser?.emailAddresses[0].emailAddress.split("@")[0] === user.username;

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;

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
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <Link
        href={`/profile/${user.username}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={user.image ?? "/avatar.png"} />
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">
            {user.name ?? user.username}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            @{user.username}
          </p>
          {user.bio && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {user.bio}
            </p>
          )}
        </div>
      </Link>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-muted-foreground hidden sm:block">
          {user._count.followers.toLocaleString()} followers
        </span>
        {!isOwnProfile && (
          <Button
            size="sm"
            variant={isFollowing ? "outline" : "default"}
            onClick={handleFollow}
            disabled={isLoading}
            className="min-w-22.5"
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </Button>
        )}
      </div>
    </div>
  );
}

export function FollowModal({
  open,
  onClose,
  followers,
  following,
}: FollowModalProps) {
  return (
    <Dialog open={!!open} onOpenChange={() => onClose()}>
      <DialogContent className="w-full max-w-lg h-[90vh] p-0 flex flex-col sm:rounded-lg">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="capitalize">{open}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {open === "followers" ? (
            followers.length > 0 ? (
              followers.map((u) => <UserListItem key={u.id} user={u} />)
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No followers yet
              </p>
            )
          ) : following.length > 0 ? (
            following.map((u) => <UserListItem key={u.id} user={u} />)
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Not following anyone yet
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
