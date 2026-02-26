// "use server";

// import prisma from "@/lib/prisma";
// import { getDbUserId } from "./user.action";
// import { revalidatePath } from "next/cache";

// interface CreatePostPayload {
//   content: string;
//   imageUrl?: string | null;
//   videoUrl?: string | null;
//   articleUrl?: string | null;
//   articleTitle?: string | null;
// }

// export async function createPost(payload: CreatePostPayload) {
//   try {
//     const userId = await getDbUserId();
//     if (!userId) return { success: false, error: "Unauthorized" };

//     const post = await prisma.post.create({
//       data: {
//         content: payload.content,
//         imageUrl: payload.imageUrl || null,
//         videoUrl: payload.videoUrl || null,
//         articleUrl: payload.articleUrl || null,
//         articleTitle: payload.articleTitle || null,
//         authorId: userId,
//       },
//     });

//     revalidatePath("/"); // homepage
//     return { success: true, post };
//   } catch (error) {
//     console.error("Failed to create post:", error);
//     return { success: false, error: "Failed to create post" };
//   }
// }

// export const getPosts = async () => {
//   try {
//     const posts = await prisma.post.findMany({
//       orderBy: {
//         createdAt: "desc",
//       },
//       include: {
//         author: {
//           select: {
//             id: true,
//             name: true,
//             image: true,
//             username: true,
//           },
//         },
//         comments: {
//           include: {
//             author: {
//               select: {
//                 id: true,
//                 username: true,
//                 image: true,
//                 name: true,
//               },
//             },
//           },
//           orderBy: {
//             createdAt: "asc",
//           },
//         },
//         likes: {
//           select: {
//             userId: true,
//           },
//         },
//         _count: {
//           select: {
//             likes: true,
//             comments: true,
//           },
//         },
//       },
//     });

//     return posts;
//   } catch (error) {
//     console.log("Error in getPosts", error);
//     throw new Error("Failed to fetch posts");
//   }
// };

// export async function toggleLike(postId: string) {
//   try {
//     const userId = await getDbUserId();
//     if (!userId) return;

//     // check if like exists
//     const existingLike = await prisma.like.findUnique({
//       where: {
//         userId_postId: {
//           userId,
//           postId,
//         },
//       },
//     });

//     const post = await prisma.post.findUnique({
//       where: { id: postId },
//       select: { authorId: true },
//     });

//     if (!post) throw new Error("Post not found");

//     if (existingLike) {
//       // unlike
//       await prisma.like.delete({
//         where: {
//           userId_postId: {
//             userId,
//             postId,
//           },
//         },
//       });
//     } else {
//       // like and create notification (only if liking someone else's post)
//       await prisma.$transaction([
//         prisma.like.create({
//           data: {
//             userId,
//             postId,
//           },
//         }),
//         ...(post.authorId !== userId
//           ? [
//               prisma.notification.create({
//                 data: {
//                   type: "LIKE_POST",
//                   userId: post.authorId, // recipient (post author)
//                   creatorId: userId, // person who liked
//                   postId,
//                 },
//               }),
//             ]
//           : []),
//       ]);
//     }

//     revalidatePath("/");
//     return { success: true };
//   } catch (error) {
//     console.error("Failed to toggle like:", error);
//     return { success: false, error: "Failed to toggle like" };
//   }
// }

// export const createComment = async (postId: string, content: string) => {
//   try {
//     const userId = await getDbUserId();

//     if (!userId) return;
//     if (!content) throw new Error("Content is required");

//     const post = await prisma.post.findUnique({
//       where: { id: postId },
//       select: { authorId: true },
//     });

//     if (!post) throw new Error("Post not found");

//     // Create comment and notification in a transaction
//     const [comment] = await prisma.$transaction(async (tx) => {
//       // Create comment first
//       const newComment = await tx.comment.create({
//         data: {
//           content,
//           authorId: userId,
//           postId,
//         },
//       });

//       // Create notification if commenting on someone else's post
//       if (post.authorId !== userId) {
//         await tx.notification.create({
//           data: {
//             type: "COMMENT",
//             userId: post.authorId,
//             creatorId: userId,
//             postId,
//             commentId: newComment.id,
//           },
//         });
//       }

//       return [newComment];
//     });

//     revalidatePath(`/`);
//     return { success: true, comment };
//   } catch (error) {
//     console.error("Failed to create comment:", error);
//     return { success: false, error: "Failed to create comment" };
//   }
// };

// export const deletePost = async (postId: string) => {
//   try {
//     const userId = await getDbUserId();

//     const post = await prisma.post.findUnique({
//       where: { id: postId },
//       select: { authorId: true },
//     });

//     if (!post) throw new Error("Post not found");
//     if (post.authorId !== userId)
//       throw new Error("Unauthorized - no delete permission");

//     await prisma.post.delete({
//       where: { id: postId },
//     });

//     revalidatePath("/"); // purge the cache
//     return { success: true };
//   } catch (error) {
//     console.error("Failed to delete post:", error);
//     return { success: false, error: "Failed to delete post" };
//   }
// };


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
          select: { id: true, name: true, image: true, username: true },
        },
        likes: {
          select: { userId: true },
        },
        savedBy: {
          select: { userId: true },
        },
        comments: {
          where: { parentId: null }, // top-level only
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
    if (post.authorId !== userId)
      return { success: false, error: "Unauthorized" };

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
      await prisma.$transaction([
        prisma.like.create({ data: { userId, postId } }),
        ...(post.authorId !== userId
          ? [
              prisma.notification.create({
                data: {
                  type: "LIKE_POST",
                  userId: post.authorId,
                  creatorId: userId,
                  postId,
                },
              }),
            ]
          : []),
      ]);
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
      await prisma.$transaction([
        prisma.commentLike.create({ data: { userId, commentId } }),
        ...(comment.authorId !== userId
          ? [
              prisma.notification.create({
                data: {
                  type: "LIKE_COMMENT",
                  userId: comment.authorId,
                  creatorId: userId,
                  postId: comment.postId,
                  commentId,
                },
              }),
            ]
          : []),
      ]);
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

    const isReply = !!parentId;

    const [comment] = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          content,
          authorId: userId,
          postId,
          parentId: parentId ?? null,
        },
      });

      // Notify post author for top-level comments
      if (!isReply && post.authorId !== userId) {
        await tx.notification.create({
          data: {
            type: "COMMENT",
            userId: post.authorId,
            creatorId: userId,
            postId,
            commentId: newComment.id,
          },
        });
      }

      // Notify parent comment author for replies
      if (isReply) {
        const parentComment = await tx.comment.findUnique({
          where: { id: parentId },
          select: { authorId: true },
        });

        if (parentComment && parentComment.authorId !== userId) {
          await tx.notification.create({
            data: {
              type: "REPLY",
              userId: parentComment.authorId,
              creatorId: userId,
              postId,
              commentId: newComment.id,
            },
          });
        }
      }

      return [newComment];
    });

    revalidatePath("/");
    return { success: true, comment };
  } catch (error) {
    console.error("Failed to create comment:", error);
    return { success: false, error: "Failed to create comment" };
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