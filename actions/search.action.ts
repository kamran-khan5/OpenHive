"use server";

import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action";

export async function searchAll(query: string) {
  if (!query.trim()) return { users: [], posts: [] };

  const dbUserId = await getDbUserId();

  const [users, posts] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
          { bio: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        _count: {
          select: { followers: true, posts: true },
        },
        followers: dbUserId
          ? { where: { followerId: dbUserId }, select: { followerId: true } }
          : false,
      },
      take: 10,
    }),

    prisma.post.findMany({
      where: {
        OR: [
          { content: { contains: query, mode: "insensitive" } },
          { articleTitle: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        content: true,
        imageUrl: true,
        articleUrl: true,
        articleTitle: true,
        createdAt: true,
        author: {
          select: { id: true, name: true, username: true, image: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return {
    users: users.map((u) => ({
      ...u,
      isFollowing: dbUserId
        ? u.followers && u.followers.length > 0
        : false,
      followers: undefined,
    })),
    posts,
  };
}