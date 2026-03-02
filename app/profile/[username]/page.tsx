import {
  getProfileByUsername,
  getUserFollowers,
  getUserFollowing,
  getUserPosts,
  getUserLikedPosts,
  getUserSavedPosts,
  getUserComments,
  isFollowing,
} from "@/actions/profile.action";
import { notFound } from "next/navigation";
import ProfilePageClient from "./ProfilePageClient";
import { getDbUserId } from "@/actions/user.action";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getProfileByUsername(username);
  if (!user) return;
  return {
    title: user.name ?? user.username,
    description: user.bio || `Check out ${user.username}'s profile.`,
  };
}

async function ProfilePageServer({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getProfileByUsername(username);
  if (!user) notFound();

  const [posts, likedPosts, savedPosts, comments, followers, following, isCurrentUserFollowing, dbUserId] =
    await Promise.all([
      getUserPosts(user.id),
      getUserLikedPosts(user.id),
      getUserSavedPosts(user.id),
      getUserComments(user.id),
      getUserFollowers(user.id),
      getUserFollowing(user.id),
      isFollowing(user.id),
      getDbUserId(),
    ]);

  return (
    <ProfilePageClient
      user={user}
      posts={posts}
      likedPosts={likedPosts}
      savedPosts={savedPosts}
      comments={comments}
      followers={followers}
      following={following}
      isFollowing={isCurrentUserFollowing}
      dbUserId={dbUserId}
    />
  );
}

export default ProfilePageServer;

