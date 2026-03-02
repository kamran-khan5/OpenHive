"use server";

import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreatePostPayload {
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  articleUrl?: string | null;
  articleTitle?: string | null;
}

interface CreateReportPayload {
  type: "POST" | "USER" | "COMMENT";
  reason?: string;
  postId?: string;
  userId?: string;
  commentId?: string;
}

// ─── Post CRUD ────────────────────────────────────────────────────────────────

export async function createPost(payload: CreatePostPayload) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const post = await prisma.post.create({
      data: {
        content: payload.content,
        imageUrl: payload.imageUrl ?? null,
        videoUrl: payload.videoUrl ?? null,
        articleUrl: payload.articleUrl ?? null,
        articleTitle: payload.articleTitle ?? null,
        authorId: userId,
      },
    });

    revalidatePath("/");
    return { success: true, post };
  } catch (error) {
    console.error("Failed to create post:", error);
    return { success: false, error: "Failed to create post" };
  }
}

export async function getPosts() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, image: true, username: true ,followers:{
            select:{followerId:true}
          }},
        },
        likes: {
          select: { userId: true },
        },
        savedBy: {
          select: { userId: true },
        },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: { id: true, name: true, image: true, username: true },
            },
            likes: {
              select: { userId: true },
            },
            _count: {
              select: { likes: true, replies: true },
            },
            replies: {
              orderBy: { createdAt: "asc" },
              include: {
                author: {
                  select: { id: true, name: true, image: true, username: true },
                },
                likes: {
                  select: { userId: true },
                },
                _count: {
                  select: { likes: true },
                },
              },
            },
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    return posts;
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    throw new Error("Failed to fetch posts");
  }
}

export async function deletePost(postId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) return { success: false, error: "Post not found" };
    if (post.authorId !== userId) return { success: false, error: "Unauthorized" };

    await prisma.post.delete({ where: { id: postId } });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete post:", error);
    return { success: false, error: "Failed to delete post" };
  }
}

// ─── Post Likes ───────────────────────────────────────────────────────────────

export async function toggleLike(postId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const [existingLike, post] = await Promise.all([
      prisma.like.findUnique({
        where: { userId_postId: { userId, postId } },
      }),
      prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      }),
    ]);

    if (!post) return { success: false, error: "Post not found" };

    if (existingLike) {
      await prisma.like.delete({
        where: { userId_postId: { userId, postId } },
      });
    } else {
      await prisma.like.create({ data: { userId, postId } });

      if (post.authorId !== userId) {
        await prisma.notification.create({
          data: {
            type: "LIKE_POST",
            userId: post.authorId,
            creatorId: userId,
            postId,
          },
        });
      }
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return { success: false, error: "Failed to toggle like" };
  }
}

// ─── Comment Likes ────────────────────────────────────────────────────────────

export async function toggleCommentLike(commentId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const [existingLike, comment] = await Promise.all([
      prisma.commentLike.findUnique({
        where: { userId_commentId: { userId, commentId } },
      }),
      prisma.comment.findUnique({
        where: { id: commentId },
        select: { authorId: true, postId: true },
      }),
    ]);

    if (!comment) return { success: false, error: "Comment not found" };

    if (existingLike) {
      await prisma.commentLike.delete({
        where: { userId_commentId: { userId, commentId } },
      });
    } else {
      await prisma.commentLike.create({ data: { userId, commentId } });

      if (comment.authorId !== userId) {
        await prisma.notification.create({
          data: {
            type: "LIKE_COMMENT",
            userId: comment.authorId,
            creatorId: userId,
            postId: comment.postId,
            commentId,
          },
        });
      }
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle comment like:", error);
    return { success: false, error: "Failed to toggle comment like" };
  }
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function createComment(
  postId: string,
  content: string,
  parentId?: string,
) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!content.trim()) return { success: false, error: "Content is required" };

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) return { success: false, error: "Post not found" };

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: userId,
        postId,
        parentId: parentId ?? null,
      },
    });

    if (!parentId && post.authorId !== userId) {
      await prisma.notification.create({
        data: {
          type: "COMMENT",
          userId: post.authorId,
          creatorId: userId,
          postId,
          commentId: comment.id,
        },
      });
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { authorId: true },
      });

      if (parentComment && parentComment.authorId !== userId) {
        await prisma.notification.create({
          data: {
            type: "REPLY",
            userId: parentComment.authorId,
            creatorId: userId,
            postId,
            commentId: comment.id,
          },
        });
      }
    }

    revalidatePath("/");
    return { success: true, comment };
  } catch (error) {
    console.error("Failed to create comment:", error);
    return { success: false, error: (error as Error).message };
  }
}

// ─── Comment Delete ───────────────────────────────────────────────────────────

export async function deleteComment(commentId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });

    if (!comment) return { success: false, error: "Comment not found" };
    if (comment.authorId !== userId) return { success: false, error: "Unauthorized" };

    await prisma.comment.delete({ where: { id: commentId } });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return { success: false, error: "Failed to delete comment" };
  }
}

// ─── Saved Posts ──────────────────────────────────────────────────────────────

export async function toggleSavePost(postId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const existing = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await prisma.savedPost.delete({
        where: { userId_postId: { userId, postId } },
      });
    } else {
      await prisma.savedPost.create({ data: { userId, postId } });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle save:", error);
    return { success: false, error: "Failed to toggle save" };
  }
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function createReport({
  type,
  reason,
  postId,
  userId: targetUserId,
  commentId,
}: CreateReportPayload) {
  try {
    const reporterId = await getDbUserId();
    if (!reporterId) return { success: false, error: "Unauthorized" };

    await prisma.report.create({
      data: {
        reporterId,
        type,
        reason: reason ?? null,
        postId: postId ?? null,
        userId: targetUserId ?? null,
        commentId: commentId ?? null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to create report:", error);
    return { success: false, error: "Failed to create report" };
  }
}