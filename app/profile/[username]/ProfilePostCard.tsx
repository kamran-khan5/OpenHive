"use client";

import { getPosts, deletePost, toggleLike, toggleSavePost, deleteComment } from "@/actions/post.action";
import { getUserComments } from "@/actions/profile.action";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookmarkIcon, HeartIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";

type Posts = Awaited<ReturnType<typeof getPosts>>;
type Comments = Awaited<ReturnType<typeof getUserComments>>;

interface PostPreviewCardProps {
  post: Posts[number];
  dbUserId: string | null;
  showLike?: boolean;
  showSave?: boolean;
  showDelete?: boolean;
  initialLiked?: boolean;
  initialSaved?: boolean;
  onRemove?: (postId: string) => void;
}

export function PostPreviewCard({
  post,
  showLike = false,
  showSave = false,
  showDelete = false,
  initialLiked = false,
  initialSaved = false,
  onRemove,
}: PostPreviewCardProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isActing, setIsActing] = useState(false);

  const handleLike = async () => {
    if (isActing) return;
    setIsActing(true);
    const prev = isLiked;
    setIsLiked((p) => !p);
    try {
      await toggleLike(post.id);
      if (prev) onRemove?.(post.id);
    } catch {
      setIsLiked(prev);
      toast.error("Failed to update like");
    } finally {
      setIsActing(false);
    }
  };

  const handleSave = async () => {
    if (isActing) return;
    setIsActing(true);
    const prev = isSaved;
    setIsSaved((p) => !p);
    try {
      await toggleSavePost(post.id);
      toast.success(prev ? "Post unsaved" : "Post saved");
      if (prev) onRemove?.(post.id);
    } catch {
      setIsSaved(prev);
      toast.error("Failed to update saved post");
    } finally {
      setIsActing(false);
    }
  };

  const handleDelete = async () => {
    if (isActing) return;
    setIsActing(true);
    try {
      const result = await deletePost(post.id);
      if (result.success) {
        toast.success("Post deleted");
        onRemove?.(post.id);
      } else {
        toast.error(result.error ?? "Failed to delete post");
      }
    } catch {
      toast.error("Failed to delete post");
    } finally {
      setIsActing(false);
    }
  };

  return (
    <Card className="overflow-hidden border-border/60">
      <CardContent className="p-4 space-y-3">
        {post.content && (
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
            {post.content}
          </p>
        )}

        {post.videoUrl ? (
          <div className="rounded-xl overflow-hidden bg-black aspect-video">
            <video src={post.videoUrl} controls preload="metadata" className="w-full h-full object-contain" />
          </div>
        ) : post.imageUrl ? (
          <div className="rounded-xl overflow-hidden bg-muted">
            <Image src={post.imageUrl} alt="Post" width={800} height={480} className="w-full object-cover max-h-120" />
          </div>
        ) : post.articleUrl ? (
          <a
            href={post.articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 hover:bg-muted/70 transition-colors p-4"
          >
            <div className="min-w-0">
              {post.articleTitle && (
                <p className="text-sm font-medium line-clamp-2">{post.articleTitle}</p>
              )}
              <p className="text-xs text-muted-foreground truncate mt-0.5">{post.articleUrl}</p>
            </div>
          </a>
        ) : null}

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            {format(new Date(post.createdAt), "MMM d, yyyy")}
          </p>
          <div className="flex items-center gap-1">
            {showLike && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isActing}
                className={`gap-1.5 h-7 px-2 text-xs transition-colors ${
                  isLiked ? "text-rose-500 hover:text-rose-600" : "text-muted-foreground hover:text-rose-500"
                }`}
              >
                <HeartIcon className={`size-3.5 ${isLiked ? "fill-rose-500" : ""}`} />
                {isLiked ? "Unlike" : "Like"}
              </Button>
            )}
            {showSave && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={isActing}
                className={`gap-1.5 h-7 px-2 text-xs transition-colors ${
                  isSaved ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-amber-500"
                }`}
              >
                <BookmarkIcon className={`size-3.5 ${isSaved ? "fill-amber-500" : ""}`} />
                {isSaved ? "Unsave" : "Save"}
              </Button>
            )}
            {showDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isActing}
                className="gap-1.5 h-7 px-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2Icon className="size-3.5" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CommentCardProps {
  comment: Comments[number];
  showDelete?: boolean;
  onRemove?: (commentId: string) => void;
}

export function CommentCard({ comment, showDelete = false, onRemove }: CommentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const post = comment.post;

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await deleteComment(comment.id);
      if (result.success) {
        toast.success("Comment deleted");
        onRemove?.(comment.id);
      } else {
        toast.error(result.error ?? "Failed to delete comment");
      }
    } catch {
      toast.error("Failed to delete comment");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-3">
        <div className="rounded-lg bg-muted/40 p-3 space-y-1">
          <p className="text-xs text-muted-foreground font-medium">
            On {post.author.name ?? post.author.username}&apos;s post
          </p>
          {post.content && (
            <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
          )}
        </div>

        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
          {comment.content}
        </p>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            {format(new Date(comment.createdAt), "MMM d, yyyy")}
          </p>
          {showDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-1.5 h-7 px-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2Icon className="size-3.5" />
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}