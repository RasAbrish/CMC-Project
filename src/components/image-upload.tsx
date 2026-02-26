"use client";

import { useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function ImageUpload({ onUpload, children, className, style }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await res.json();
      onUpload(data.url);
      toast.success("Image uploaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div 
      className={className} 
      style={{ position: "relative", ...style }} 
      onClick={(e) => {
          // If a button inside was clicked, let the wrapper open the file picker.
          // But prevent bubbling if needed, though usually standard wrapping is fine.
          fileInputRef.current?.click();
      }}
    >
      {isUploading && (
        <div style={{ 
          position: "absolute", 
          inset: 0, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          background: "rgba(0,0,0,0.5)", 
          borderRadius: "inherit", 
          zIndex: 10 
        }}>
          <Loader2 className="spinner" size={24} color="white" />
        </div>
      )}
      {children}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />
    </div>
  );
}
