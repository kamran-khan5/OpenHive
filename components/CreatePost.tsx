"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  ImageIcon,
  VideoIcon,
  FileTextIcon,
  Loader2Icon,
  SendIcon,
  Trash2Icon,
} from "lucide-react";
import { createPost } from "@/actions/post.action";
import toast from "react-hot-toast";
import Image from "next/image";


type ModalType = "image" | "video" | "article" | null;


export const CreatePost = () => {
  const { user } = useUser();

  const [modalType, setModalType] = useState<ModalType>(null);
  const [content, setContent] = useState("");

  // Preview state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [articleUrl, setArticleUrl] = useState("");
  const [articleTitle, setArticleTitle] = useState("");

  const [isPosting, setIsPosting] = useState(false);

  const resetState = () => {
    setContent("");
    setImageFile(null);
    setVideoFile(null);
    setImagePreview(null);
    setVideoPreview(null);
    setArticleUrl("");
    setArticleTitle("");
    setModalType(null);
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (modalType === "image") {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else if (modalType === "video") {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  // Discard preview
  const handleDiscard = () => {
    if (modalType === "image") {
      setImageFile(null);
      setImagePreview(null);
    } else if (modalType === "video") {
      setVideoFile(null);
      setVideoPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile && !videoFile && !articleUrl) return;

    try {
      setIsPosting(true);

      // Upload files to Cloudinary
      let uploadedImageUrl = null;
      let uploadedVideoUrl = null;

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("upload_preset", "YOUR_UPLOAD_PRESET");
        const res = await fetch(
          "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload",
          {
            method: "POST",
            body: formData,
          },
        );
        const data = await res.json();
        uploadedImageUrl = data.secure_url;
      }

      if (videoFile) {
        const formData = new FormData();
        formData.append("file", videoFile);
        formData.append("upload_preset", "YOUR_UPLOAD_PRESET");
        const res = await fetch(
          "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/video/upload",
          {
            method: "POST",
            body: formData,
          },
        );
        const data = await res.json();
        uploadedVideoUrl = data.secure_url;
      }

      const result = await createPost({
        content: content.trim(),
        imageUrl: uploadedImageUrl,
        videoUrl: uploadedVideoUrl,
        articleUrl: articleUrl || null,
        articleTitle: articleTitle || null,
      });

      if (result?.success) {
        toast.success("Post created successfully 🎉");
        resetState();
      } else {
        toast.error("Something went wrong");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  const canPost =
    content.trim() || imageFile || videoFile || articleUrl ? true : false;

  if (!user) return null;

  return (
    <>
      {/* Main Card */}
      <Card className="mb-6">
        <CardContent className="pt-5 pb-4 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.imageUrl} />
            </Avatar>

            <Button
              variant="outline"
              className="flex-1 justify-start text-muted-foreground rounded-full"
              onClick={() => setModalType("image")}
            >
              What&apos;s on your mind, {user.firstName}?
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="ghost"
              onClick={() => setModalType("image")}
              className="gap-2"
            >
              <ImageIcon size={18} className="text-emerald-500" />
              Photo
            </Button>

            <Button
              variant="ghost"
              onClick={() => setModalType("video")}
              className="gap-2"
            >
              <VideoIcon size={18} className="text-red-500" />
              Video
            </Button>

            <Button
              variant="ghost"
              onClick={() => setModalType("article")}
              className="gap-2"
            >
              <FileTextIcon size={18} className="text-blue-500" />
              Article
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={!!modalType} onOpenChange={() => setModalType(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modalType === "image" && (
                <>
                  <ImageIcon size={16} /> Create Photo Post
                </>
              )}
              {modalType === "video" && (
                <>
                  <VideoIcon size={16} /> Create Video Post
                </>
              )}
              {modalType === "article" && (
                <>
                  <FileTextIcon size={16} /> Share an Article
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPosting}
            />

            {/* Image Preview */}
            {/* Image Upload / Preview */}
            {modalType === "image" && (
              <div className="space-y-2">
                {!imagePreview ? (
                  <label className="cursor-pointer inline-block px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                    Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files && handleFileSelect(e.target.files[0])
                      }
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-h-64 object-cover rounded-lg"
                      width={400}
                      height={300}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleDiscard}
                    >
                      <Trash2Icon size={16} />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Video Upload / Preview */}
            {modalType === "video" && (
              <div className="space-y-2">
                {!videoPreview ? (
                  <label className="cursor-pointer inline-block px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                    Choose Video
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files && handleFileSelect(e.target.files[0])
                      }
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <video
                      src={videoPreview}
                      controls
                      className="w-full max-h-64 rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleDiscard}
                    >
                      <Trash2Icon size={16} />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Article Inputs */}
            {modalType === "article" && (
              <div className="space-y-3">
                <Input
                  placeholder="Article title"
                  value={articleTitle}
                  onChange={(e) => setArticleTitle(e.target.value)}
                />
                <Input
                  placeholder="https://example.com"
                  value={articleUrl}
                  onChange={(e) => setArticleUrl(e.target.value)}
                />
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModalType(null)} disabled={isPosting}>
                Cancel
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={!canPost || isPosting}
                className="gap-2"
              >
                {isPosting ? (
                  <Loader2Icon size={16} className="animate-spin" />
                ) : (
                  <SendIcon size={16} />
                )}
                Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
