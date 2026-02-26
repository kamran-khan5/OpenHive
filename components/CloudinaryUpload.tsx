"use client";

import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import Image from "next/image";

interface Props {
  type: "image" | "video";
  value: string;
  onChange: (url: string) => void;
}

export const CloudinaryUpload = ({ type, value, onChange }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    setLoading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      const base64 = reader.result;

      const res = await fetch("/api/upload", {
        method: "POST",
        body: JSON.stringify({
          file: base64,
          type,
        }),
      });

      const data = await res.json();

      if (data.secure_url) {
        onChange(data.secure_url);
      }

      setLoading(false);
    };
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        type="file"
        hidden
        ref={inputRef}
        accept={type === "image" ? "image/*" : "video/*"}
        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
      />

      <Button
        type="button"
        variant="secondary"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Upload {type}
      </Button>

      {value && type === "image" && (
        <img
          src={value}
          alt="Uploaded"
          className="rounded-xl max-h-60 object-cover"
          // width={400}
          // height={400}
        />
      )}

      {value && type === "video" && (
        <video src={value} controls className="rounded-xl max-h-60" />
      )}
    </div>
  );
};
