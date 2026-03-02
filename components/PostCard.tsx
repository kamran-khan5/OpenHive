"use client";

import {
  createComment,
  deletePost,
  getPosts,
  toggleLike,
  toggleSavePost,
  toggleCommentLike,
  createReport,
  deleteComment,
} from "@/actions/post.action";
import { toggleFollow } from "@/actions/user.action";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { Card, CardContent } from "./ui/card";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Button } from "./ui/button";
import {
  HeartIcon,
  LogInIcon,
  MessageCircleIcon,
  SendIcon,
  BookmarkIcon,
  MoreHorizontalIcon,
  FlagIcon,
  CornerDownRightIcon,
  XIcon,
  ExternalLinkIcon,
  Trash2Icon,
} from "lucide-react";
import { Textarea } from "./ui/textarea";
import { DeleteAlertDialog } from "./DeleteAlertDialog";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type Posts = Awaited<ReturnType<typeof getPosts>>;
type Post = Posts[number];
type Comment = Post["comments"][number];

// ─── CommentItem ──────────────────────────────────────────────────────────────

interface CommentItemProps {
  comment: Comment;
  dbUserId: string | null;
  postId: string;
  isAuthenticated: boolean;
  depth?: number;
  onReplySuccess: () => void;
}

const CommentItem = ({
  comment,
  dbUserId,
  postId,
  isAuthenticated,
  depth = 0,
  onReplySuccess,
}: CommentItemProps) => {
  const [replyText, setReplyText] = useState("");
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiked, setIsLiked] = useState(
    comment.likes?.some((l) => l.userId === dbUserId) ?? false,
  );
  const [likeCount, setLikeCount] = useState(comment._count?.likes ?? 0);

  const handleCommentLike = async () => {
    if (!isAuthenticated) return;
    setIsLiked((p) => !p);
    setLikeCount((p) => p + (isLiked ? -1 : 1));
    try {
      await toggleCommentLike(comment.id);
    } catch {
      setIsLiked((p) => !p);
      setLikeCount((p) => p + (isLiked ? 1 : -1));
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || isReplying) return;
    try {
      setIsReplying(true);
      const result = await createComment(postId, replyText, comment.id);
      if (result?.success) {
        toast.success("Reply posted");
        setReplyText("");
        setShowReplyBox(false);
        onReplySuccess();
      }
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setIsReplying(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await deleteComment(comment.id);
      if (result.success) {
        toast.success("Comment deleted");
        onReplySuccess();
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
    <div
      className={cn(
        "group",
        depth > 0 && "ml-8 border-l-2 border-border/50 pl-4",
      )}
    >
      <div className="flex gap-3 py-3">
        <Link href={`/profile/${comment.author.username}`} className="shrink-0">
          <Avatar className="size-7">
            <AvatarImage src={comment.author.image ?? ""} />
            <AvatarFallback className="text-xs bg-muted">
              {comment.author.name?.[0] ?? "U"}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/profile/${comment.author.username}`}
              className="text-sm font-semibold hover:underline truncate"
            >
              {comment.author.name}
            </Link>
            <span className="text-xs text-muted-foreground">
              @{comment.author.username} ·{" "}
              {formatDistanceToNow(new Date(comment.createdAt))} ago
            </span>
          </div>

          <p className="text-sm mt-0.5 text-foreground/90 break-words leading-relaxed">
            {comment.content}
          </p>

          <div className="flex items-center gap-3 mt-1.5">
            {isAuthenticated && (
              <button
                onClick={handleCommentLike}
                className={cn(
                  "flex items-center gap-1 text-xs transition-colors",
                  isLiked
                    ? "text-rose-500"
                    : "text-muted-foreground hover:text-rose-400",
                )}
              >
                <HeartIcon
                  className={cn("size-3.5", isLiked && "fill-rose-500")}
                />
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>
            )}

            {isAuthenticated && depth === 0 && (
              <button
                onClick={() => setShowReplyBox((p) => !p)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <CornerDownRightIcon className="size-3.5" />
                Reply
              </button>
            )}

            {comment.author.id === dbUserId && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              >
                <Trash2Icon className="size-3.5" />
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>

          {showReplyBox && (
            <div className="mt-2 flex gap-2">
              <Textarea
                placeholder={`Reply to @${comment.author.username}…`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-16 resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                    handleReply();
                }}
              />
              <div className="flex flex-col gap-1.5">
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={!replyText.trim() || isReplying}
                  className="shrink-0"
                >
                  <SendIcon className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowReplyBox(false);
                    setReplyText("");
                  }}
                  className="shrink-0"
                >
                  <XIcon className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply as Comment}
          dbUserId={dbUserId}
          postId={postId}
          isAuthenticated={isAuthenticated}
          depth={depth + 1}
          onReplySuccess={onReplySuccess}
        />
      ))}
    </div>
  );
};

// ─── ReportDialog ─────────────────────────────────────────────────────────────

const REPORT_REASONS = [
  "Spam or misleading",
  "Harassment or hate speech",
  "Violence or dangerous content",
  "Misinformation",
  "Nudity or sexual content",
  "Other",
];

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  postId: string;
}

const ReportDialog = ({ open, onClose, postId }: ReportDialogProps) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await createReport({ postId, type: "POST", reason });
      toast.success("Report submitted. We'll review it shortly.");
      onClose();
    } catch {
      toast.error("Failed to submit report");
    } finally {
      setIsSubmitting(false);
      setReason("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlagIcon className="size-4 text-destructive" />
            Report Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Help us understand what&apos;s wrong with this post.
          </p>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger>
              <SelectValue placeholder="Select a reason…" />
            </SelectTrigger>
            <SelectContent>
              {REPORT_REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
          >
            {isSubmitting ? "Submitting…" : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── PostMedia ────────────────────────────────────────────────────────────────

const PostMedia = ({ post }: { post: Post }) => {
  if (post.videoUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video mt-3">
        <video
          src={post.videoUrl}
          controls
          preload="metadata"
          className="w-full h-full object-contain"
          poster={post.imageUrl ?? undefined}
        />
      </div>
    );
  }

  if (post.imageUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden mt-3 bg-muted max-h-[520px]">
        <Image
          src={post.imageUrl}
          alt="Post image"
          width={800}
          height={520}
          className="w-full object-cover"
        />
      </div>
    );
  }

  if (post.articleUrl) {
    return (
      <a
        href={post.articleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-start gap-3 rounded-xl border border-border bg-muted/40 hover:bg-muted/70 transition-colors p-4 group"
      >
        <ExternalLinkIcon className="size-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-foreground transition-colors" />
        <div className="min-w-0">
          {post.articleTitle && (
            <p className="text-sm font-medium line-clamp-2 leading-snug">
              {post.articleTitle}
            </p>
          )}
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {post.articleUrl}
          </p>
        </div>
      </a>
    );
  }

  return null;
};

// ─── PostCard ─────────────────────────────────────────────────────────────────

export const PostCard = ({
  post,
  dbUserId,
}: {
  post: Post;
  dbUserId: string | null;
}) => {
  const { user } = useUser();
  const router = useRouter();
  const isAuthenticated = !!user;
  const isAuthor = dbUserId === post.author.id;

  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const [hasLiked, setHasLiked] = useState(
    post.likes.some((like) => like.userId === dbUserId),
  );
  const [optimisticLikes, setOptimisticLikes] = useState(post._count.likes);
  const [hasSaved, setHasSaved] = useState(
    post.savedBy?.some((s) => s.userId === dbUserId) ?? false,
  );

  const [isFollowingAuthor, setIsFollowingAuthor] = useState(
    post.author.followers?.some((f) => f.followerId === dbUserId) ?? false,
  );
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);

  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const handleLike = async () => {
    if (isLiking || !isAuthenticated) return;
    setIsLiking(true);
    setHasLiked((p) => !p);
    setOptimisticLikes((p) => p + (hasLiked ? -1 : 1));
    try {
      await toggleLike(post.id);
    } catch {
      setOptimisticLikes(post._count.likes);
      setHasLiked(post.likes.some((l) => l.userId === dbUserId));
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    if (isSaving || !isAuthenticated) return;
    setIsSaving(true);
    const prev = hasSaved;
    setHasSaved((p) => !p);
    try {
      await toggleSavePost(post.id);
      toast.success(prev ? "Post unsaved" : "Post saved");
    } catch {
      setHasSaved(prev);
      toast.error("Failed to update saved posts");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated || isFollowingLoading) return;
    const prev = isFollowingAuthor;
    setIsFollowingAuthor((p) => !p);
    setIsFollowingLoading(true);
    try {
      const result = await toggleFollow(post.author.id);
      if (!result?.success) {
        setIsFollowingAuthor(prev);
        toast.error("Failed to update follow status");
      } else {
        toast.success(prev ? "Unfollowed" : "Now following");
      }
    } catch {
      setIsFollowingAuthor(prev);
      toast.error("Failed to update follow status");
    } finally {
      setIsFollowingLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isCommenting) return;
    try {
      setIsCommenting(true);
      const result = await createComment(post.id, newComment);
      if (result?.success) {
        toast.success("Comment posted");
        setNewComment("");
        router.refresh();
      } else {
        toast.error(result?.error ?? "Failed to post comment");
      }
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeletePost = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await deletePost(post.id);
      if (result.success) {
        toast.success("Post deleted");
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch {
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const focusCommentInput = () => {
    setShowComments(true);
    setTimeout(() => commentInputRef.current?.focus(), 100);
  };

  return (
    <>
      <Card className="overflow-hidden border-border/60 hover:border-border transition-colors duration-200">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-start justify-between px-4 pt-4 pb-0">
            <div className="flex items-start gap-3">
              <Link
                href={`/profile/${post.author.username}`}
                className="shrink-0"
              >
                <Avatar className="size-10">
                  <AvatarImage src={post.author.image ?? ""} />
                  <AvatarFallback className="text-sm bg-muted font-medium">
                    {post.author.name?.[0] ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/profile/${post.author.username}`}
                    className="text-sm font-semibold hover:underline leading-tight"
                  >
                    {post.author.name}
                  </Link>

                  {/* Follow button — only when authenticated, not own post, not already following */}
                  {isAuthenticated && !isAuthor && !isFollowingAuthor && (
                    <button
                      onClick={handleFollow}
                      disabled={isFollowingLoading}
                      className="text-xs font-medium text-primary hover:text-primary/70 transition-colors disabled:opacity-50"
                    >
                      + Follow
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  @{post.author.username} ·{" "}
                  {formatDistanceToNow(new Date(post.createdAt))} ago
                </p>
              </div>
            </div>

            {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 -mr-1 text-muted-foreground"
                >
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {isAuthor ? (
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="p-0 focus:bg-transparent"
                  >
                    <DeleteAlertDialog
                      isDeleting={isDeleting}
                      onDelete={handleDeletePost}
                    />
                  </DropdownMenuItem>
                ) : (
                  isAuthenticated && (
                    <DropdownMenuItem
                      onSelect={() => setShowReportDialog(true)}
                      className="gap-2 text-muted-foreground cursor-pointer"
                    >
                      <FlagIcon className="size-3.5" />
                      Report post
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          <div className="px-4 pt-3">
            {post.content && (
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
                {post.content}
              </p>
            )}
            <PostMedia post={post} />
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between px-4 py-3 mt-1">
            <div className="flex items-center gap-1">
              {/* Like */}
              {isAuthenticated ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={isLiking}
                  className={cn(
                    "gap-1.5 h-8 px-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors",
                    hasLiked && "text-rose-500",
                  )}
                >
                  <HeartIcon
                    className={cn(
                      "size-4 transition-transform",
                      hasLiked && "fill-rose-500 scale-110",
                    )}
                  />
                  <span className="text-xs tabular-nums">{optimisticLikes}</span>
                </Button>
              ) : (
                <SignInButton mode="modal">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 h-8 px-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                  >
                    <HeartIcon className="size-4" />
                    <span className="text-xs tabular-nums">{optimisticLikes}</span>
                  </Button>
                </SignInButton>
              )}

              {/* Comment */}
              <Button
                variant="ghost"
                size="sm"
                onClick={focusCommentInput}
                className="gap-1.5 h-8 px-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
              >
                <MessageCircleIcon className="size-4" />
                <span className="text-xs tabular-nums">
                  {post._count.comments}
                </span>
              </Button>
            </div>

            {/* Save */}
            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  "gap-1.5 h-8 px-2 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors",
                  hasSaved && "text-amber-500",
                )}
              >
                <BookmarkIcon
                  className={cn("size-4", hasSaved && "fill-amber-500")}
                />
                <span className="text-xs">{hasSaved ? "Saved" : "Save"}</span>
              </Button>
            ) : (
              <SignInButton mode="modal">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 h-8 px-2 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                >
                  <BookmarkIcon className="size-4" />
                  <span className="text-xs">Save</span>
                </Button>
              </SignInButton>
            )}
          </div>

          {/* Comments section */}
          <div
            className={cn(
              "border-t border-border/50 overflow-hidden transition-all duration-300",
              showComments ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
            )}
          >
            <div className="px-4 py-3">
              {/* Comment input */}
              {isAuthenticated ? (
                <div className="flex gap-3 mb-3">
                  <Avatar className="size-8 shrink-0 mt-0.5">
                    <AvatarImage src={user?.imageUrl ?? ""} />
                    <AvatarFallback className="text-xs bg-muted">
                      {user?.firstName?.[0] ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      ref={commentInputRef}
                      placeholder="Write a comment…"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-16 resize-none text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                          handleAddComment();
                      }}
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || isCommenting}
                        className="gap-2"
                      >
                        {isCommenting ? (
                          "Posting…"
                        ) : (
                          <>
                            <SendIcon className="size-3.5" />
                            Comment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center py-3">
                  <SignInButton mode="modal">
                    <Button variant="outline" size="sm" className="gap-2">
                      <LogInIcon className="size-4" />
                      Sign in to comment
                    </Button>
                  </SignInButton>
                </div>
              )}

              {/* Comment list */}
              {post.comments.length > 0 && (
                <div className="divide-y divide-border/40">
                  {post.comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      dbUserId={dbUserId}
                      postId={post.id}
                      isAuthenticated={isAuthenticated}
                      onReplySuccess={() => router.refresh()}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Toggle comments */}
          {post._count.comments > 0 && !showComments && (
            <button
              onClick={() => setShowComments(true)}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border/50 py-2.5 hover:bg-muted/30"
            >
              View {post._count.comments} comment
              {post._count.comments !== 1 ? "s" : ""}
            </button>
          )}

          {showComments && (
            <button
              onClick={() => setShowComments(false)}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border/50 py-2 hover:bg-muted/30"
            >
              Hide comments
            </button>
          )}
        </CardContent>
      </Card>

      <ReportDialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        postId={post.id}
      />
    </>
  );
};