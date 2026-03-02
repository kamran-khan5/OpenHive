"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getDbUserId } from "./user.action";

export async function getProfileByUsername(username: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        location: true,
        website: true,
        createdAt: true,
      },
    });

    if (!user) return null;

    const [followersCount, followingCount, postsCount] = await Promise.all([
      prisma.follows.count({ where: { followingId: user.id } }),
      prisma.follows.count({ where: { followerId: user.id } }),
      prisma.post.count({ where: { authorId: user.id } }),
    ]);

    return {
      ...user,
      _count: {
        followers: followersCount,
        following: followingCount,
        posts: postsCount,
      },
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw new Error("Failed to fetch profile");
  }
}

const postInclude = {
  author: {
    select: { id: true, name: true, username: true, image: true },
  },
  likes: {
    select: { userId: true },
  },
  savedBy: {
    select: { userId: true },
  },
  comments: {
    where: { parentId: null },
    orderBy: { createdAt: "asc" as const },
    include: {
      author: {
        select: { id: true, name: true, username: true, image: true },
      },
      likes: { select: { userId: true } },
      _count: { select: { likes: true, replies: true } },
      replies: {
        orderBy: { createdAt: "asc" as const },
        include: {
          author: {
            select: { id: true, name: true, username: true, image: true },
          },
          likes: { select: { userId: true } },
          _count: { select: { likes: true } },
        },
      },
    },
  },
  _count: {
    select: { likes: true, comments: true },
  },
};

export async function getUserPosts(userId: string) {
  try {
    return await prisma.post.findMany({
      where: { authorId: userId },
      include: postInclude,
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    throw new Error("Failed to fetch user posts");
  }
}

export async function getUserLikedPosts(userId: string) {
  try {
    return await prisma.post.findMany({
      where: { likes: { some: { userId } } },
      include: postInclude,
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching liked posts:", error);
    throw new Error("Failed to fetch liked posts");
  }
}

export async function getUserSavedPosts(userId: string) {
  try {
    const saved = await prisma.savedPost.findMany({
      where: { userId },
      include: { post: { include: postInclude } },
      orderBy: { createdAt: "desc" },
    });
    return saved.map((s) => s.post);
  } catch (error) {
    console.error("Error fetching saved posts:", error);
    throw new Error("Failed to fetch saved posts");
  }
}

export async function getUserComments(userId: string) {
  try {
    return await prisma.comment.findMany({
      where: { authorId: userId, parentId: null },
      orderBy: { createdAt: "desc" },
      include: {
        post: {
          include: postInclude,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user comments:", error);
    throw new Error("Failed to fetch user comments");
  }
}

export async function getUserFollowers(userId: string) {
  try {
    const currentUserId = await getDbUserId();

    const followers = await prisma.follows.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const users = followers.map((f) => f.follower);

    const counts = await Promise.all(
      users.map((u) =>
        prisma.follows.count({ where: { followingId: u.id } })
      )
    );

    const followChecks = currentUserId
      ? await Promise.all(
          users.map((u) =>
            prisma.follows.findUnique({
              where: {
                followerId_followingId: {
                  followerId: currentUserId,
                  followingId: u.id,
                },
              },
            })
          )
        )
      : [];

    return users.map((u, i) => ({
      ...u,
      isFollowing: currentUserId ? !!followChecks[i] : false,
      _count: {
        followers: counts[i],
        following: 0,
      },
    }));
  } catch (error) {
    console.error("Error fetching followers:", error);
    throw new Error("Failed to fetch followers");
  }
}

export async function getUserFollowing(userId: string) {
  try {
    const currentUserId = await getDbUserId();

    const following = await prisma.follows.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const users = following.map((f) => f.following);

    const counts = await Promise.all(
      users.map((u) =>
        prisma.follows.count({ where: { followingId: u.id } })
      )
    );

    const followChecks = currentUserId
      ? await Promise.all(
          users.map((u) =>
            prisma.follows.findUnique({
              where: {
                followerId_followingId: {
                  followerId: currentUserId,
                  followingId: u.id,
                },
              },
            })
          )
        )
      : [];

    return users.map((u, i) => ({
      ...u,
      isFollowing: currentUserId ? !!followChecks[i] : false,
      _count: {
        followers: counts[i],
        following: 0,
      },
    }));
  } catch (error) {
    console.error("Error fetching following:", error);
    throw new Error("Failed to fetch following");
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string;
    const location = formData.get("location") as string;
    const website = formData.get("website") as string;

    const user = await prisma.user.update({
      where: { clerkId },
      data: { name, bio, location, website },
    });

    revalidatePath("/profile");
    return { success: true, user };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function isFollowing(userId: string) {
  try {
    const currentUserId = await getDbUserId();
    if (!currentUserId) return false;

    const follow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId,
        },
      },
    });

    return !!follow;
  } catch (error) {
    console.error("Error checking follow status:", error);
    return false;
  }
}