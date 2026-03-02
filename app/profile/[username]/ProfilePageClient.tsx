"use client";

import { getPosts } from "@/actions/post.action";
import {
  getProfileByUsername,
  getUserComments,
  getUserFollowers,
  getUserFollowing,
  getUserLikedPosts,
  getUserSavedPosts,
  updateProfile,
} from "@/actions/profile.action";
import { toggleFollow } from "@/actions/user.action";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SignInButton, useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import {
  BookmarkIcon,
  CalendarIcon,
  EditIcon,
  FileTextIcon,
  HeartIcon,
  LinkIcon,
  MapPinIcon,
  MessageSquareIcon,
} from "lucide-react";
import { useState } from "react";

import { PostPreviewCard, CommentCard } from "./ProfilePostCard";
import { FollowModal } from "./ProfileUserList";
import toast from "react-hot-toast";

type User = Awaited<ReturnType<typeof getProfileByUsername>>;
type Posts = Awaited<ReturnType<typeof getPosts>>;
type LikedPosts = Awaited<ReturnType<typeof getUserLikedPosts>>;
type SavedPosts = Awaited<ReturnType<typeof getUserSavedPosts>>;
type Comments = Awaited<ReturnType<typeof getUserComments>>;
type Followers = Awaited<ReturnType<typeof getUserFollowers>>;
type Following = Awaited<ReturnType<typeof getUserFollowing>>;

type FollowModalType = "followers" | "following" | null;

interface ProfilePageClientProps {
  user: NonNullable<User>;
  posts: Posts;
  likedPosts: LikedPosts;
  savedPosts: SavedPosts;
  comments: Comments;
  followers: Followers;
  following: Following;
  isFollowing: boolean;
  dbUserId: string | null;
}

function EmptyState({ message }: { message: string }) {
  return <div className="text-center py-8 text-muted-foreground">{message}</div>;
}

function ProfilePageClient({
  isFollowing: initialIsFollowing,
  posts: initialPosts,
  likedPosts: initialLikedPosts,
  savedPosts: initialSavedPosts,
  comments: initialComments,
  followers,
  following,
  user,
  dbUserId,
}: ProfilePageClientProps) {
  const { user: currentUser } = useUser();

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [followModal, setFollowModal] = useState<FollowModalType>(null);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);

  const [posts, setPosts] = useState(initialPosts);
  const [likedPosts, setLikedPosts] = useState(initialLikedPosts);
  const [savedPosts, setSavedPosts] = useState(initialSavedPosts);
  const [comments, setComments] = useState(initialComments);

  const [editForm, setEditForm] = useState({
    name: user.name || "",
    bio: user.bio || "",
    location: user.location || "",
    website: user.website || "",
  });

  const removeById = <T extends { id: string }>(list: T[], id: string) =>
    list.filter((item) => item.id !== id);

  const handleEditSubmit = async () => {
    const formData = new FormData();
    Object.entries(editForm).forEach(([key, value]) => formData.append(key, value));
    const result = await updateProfile(formData);
    if (result.success) {
      setShowEditDialog(false);
      toast.success("Profile updated successfully");
    }
  };

  const handleFollow = async () => {
  if (!currentUser) return;
  try {
    setIsUpdatingFollow(true);
    const result = await toggleFollow(user.id);
    if (result?.success) {
      setIsFollowing((p) => !p);
      toast.success(isFollowing ? "Unfollowed" : "Now following");
    } else {
      toast.error("Failed to update follow status");
    }
  } catch {
    toast.error("Failed to update follow status");
  } finally {
    setIsUpdatingFollow(false);
  }
};

  const isOwnProfile =
    currentUser?.username === user.username ||
    currentUser?.emailAddresses[0].emailAddress.split("@")[0] === user.username;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="grid grid-cols-1 gap-6">
        {/* PROFILE CARD */}
        <div className="w-full max-w-lg mx-auto">
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user.image ?? "/avatar.png"} />
                </Avatar>
                <h1 className="mt-4 text-2xl font-bold">{user.name ?? user.username}</h1>
                <p className="text-muted-foreground">@{user.username}</p>
                {user.bio && <p className="mt-2 text-sm">{user.bio}</p>}

                {/* STATS */}
                <div className="w-full mt-6">
                  <div className="flex justify-between mb-4">
                    <button
                      onClick={() => setFollowModal("following")}
                      className="hover:opacity-75 transition-opacity text-center"
                    >
                      <div className="font-semibold">{user._count.following.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Following</div>
                    </button>
                    <Separator orientation="vertical" />
                    <button
                      onClick={() => setFollowModal("followers")}
                      className="hover:opacity-75 transition-opacity text-center"
                    >
                      <div className="font-semibold">{user._count.followers.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                    </button>
                    <Separator orientation="vertical" />
                    <div className="text-center">
                      <div className="font-semibold">{user._count.posts.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Posts</div>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTON */}
                {!currentUser ? (
                  <SignInButton mode="modal">
                    <Button className="w-full mt-4">Follow</Button>
                  </SignInButton>
                ) : isOwnProfile ? (
                  <Button className="w-full mt-4" onClick={() => setShowEditDialog(true)}>
                    <EditIcon className="size-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <Button
                    className="w-full mt-4"
                    onClick={handleFollow}
                    disabled={isUpdatingFollow}
                    variant={isFollowing ? "outline" : "default"}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                )}

                {/* META */}
                <div className="w-full mt-6 space-y-2 text-sm">
                  {user.location && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPinIcon className="size-4 mr-2" />
                      {user.location}
                    </div>
                  )}
                  {user.website && (
                    <div className="flex items-center text-muted-foreground">
                      <LinkIcon className="size-4 mr-2" />
                      <a
                        href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                        className="hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {user.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center text-muted-foreground">
                    <CalendarIcon className="size-4 mr-2" />
                    Joined {format(new Date(user.createdAt), "MMMM yyyy")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TABS */}
        <Tabs defaultValue="posts" className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="w-max mx-auto sm:w-full flex justify-center border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger
                value="posts"
                className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 font-semibold"
              >
                <FileTextIcon className="size-4" />
                Posts
              </TabsTrigger>
              {isOwnProfile && (
                <>
                  <TabsTrigger
                    value="comments"
                    className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 font-semibold"
                  >
                    <MessageSquareIcon className="size-4" />
                    Comments
                  </TabsTrigger>
                  <TabsTrigger
                    value="likes"
                    className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 font-semibold"
                  >
                    <HeartIcon className="size-4" />
                    Likes
                  </TabsTrigger>
                  <TabsTrigger
                    value="saved"
                    className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 font-semibold"
                  >
                    <BookmarkIcon className="size-4" />
                    Saved
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          <TabsContent value="posts" className="mt-6">
            <div className="space-y-6">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <PostPreviewCard
                    key={post.id}
                    post={post}
                    dbUserId={dbUserId}
                    showDelete={isOwnProfile}
                    showLike={!isOwnProfile}
                    showSave={!isOwnProfile}
                    initialLiked={post.likes?.some((l) => l.userId === dbUserId)}
                    initialSaved={post.savedBy?.some((s) => s.userId === dbUserId)}
                    onRemove={(id) => setPosts((p) => removeById(p, id))}
                  />
                ))
              ) : (
                <EmptyState message="No posts yet" />
              )}
            </div>
          </TabsContent>

          {isOwnProfile && (
            <>
              <TabsContent value="comments" className="mt-6">
                <div className="space-y-6">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <CommentCard
                        key={comment.id}
                        comment={comment}
                        showDelete
                        onRemove={(id) => setComments((c) => removeById(c, id))}
                      />
                    ))
                  ) : (
                    <EmptyState message="No comments yet" />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="likes" className="mt-6">
                <div className="space-y-6">
                  {likedPosts.length > 0 ? (
                    likedPosts.map((post) => (
                      <PostPreviewCard
                        key={post.id}
                        post={post}
                        dbUserId={dbUserId}
                        showLike
                        initialLiked
                        onRemove={(id) => setLikedPosts((p) => removeById(p, id))}
                      />
                    ))
                  ) : (
                    <EmptyState message="No liked posts yet" />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="saved" className="mt-6">
                <div className="space-y-6">
                  {savedPosts.length > 0 ? (
                    savedPosts.map((post) => (
                      <PostPreviewCard
                        key={post.id}
                        post={post}
                        dbUserId={dbUserId}
                        showSave
                        initialSaved
                        onRemove={(id) => setSavedPosts((p) => removeById(p, id))}
                      />
                    ))
                  ) : (
                    <EmptyState message="No saved posts yet" />
                  )}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      <FollowModal
        open={followModal}
        onClose={() => setFollowModal(null)}
        followers={followers}
        following={following}
      />

      {/* EDIT PROFILE DIALOG */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[95vw] max-w-125 max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="min-h-25"
                  placeholder="Tell us about yourself"
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="Where are you based?"
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  placeholder="Your personal website"
                />
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-3">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleEditSubmit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProfilePageClient;