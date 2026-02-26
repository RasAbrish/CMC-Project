"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { postSchema, type PostFormData } from "@/lib/validations";
import { toast } from "sonner";
import { 
  ChevronLeft, 
  Save, 
  Eye, 
  Globe, 
  Settings, 
  ImageIcon, 
  Plus, 
  X,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { slugify } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/image-upload";

export default function PostEditorPage() {
  const { id } = useParams() as { id?: string };
  const isNew = id === "new";
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"content" | "settings">("content");

  const { data: post, isLoading: isFetching } = useQuery({
    queryKey: ["posts", id],
    queryFn: async () => {
      if (isNew) return null;
      const res = await fetch(`/api/posts/${id}`);
      if (!res.ok) throw new Error("Post not found");
      return res.json();
    },
    enabled: !isNew,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      return res.json();
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      status: "DRAFT",
      tags: [],
    },
  });

  const title = watch("title");
  const slug = watch("slug");
  const currentContent = watch("content");

  // Sync post data with form
  useEffect(() => {
    if (post) {
      reset({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || "",
        content: post.content,
        status: post.status,
        coverImage: post.coverImage || "",
        categoryId: post.categoryId || undefined,
        tags: post.tags?.map((t: any) => t.name) || [],
      });
    }
  }, [post, reset]);

  // Auto-slugify
  useEffect(() => {
    if (isNew && title && !slug) {
      setValue("slug", slugify(title));
    }
  }, [title, isNew, setValue, slug]);

  const mutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      const url = isNew ? "/api/posts" : `/api/posts/${id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success(isNew ? "Post created!" : "Post updated!");
      if (isNew) router.push(`/dashboard/posts/${data.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (!isNew && isFetching) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "100px" }}>
        <Loader2 className="spinner" size={40} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Dynamic Header */}
      <div className="page-header" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/dashboard/posts" className="btn btn-ghost btn-icon" style={{ textDecoration: "none" }}>
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="page-title">{isNew ? "Create New Post" : "Edit Post"}</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              {isNew ? "Start writing a fresh story" : `Editing: ${post?.title}`}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.open(`/preview/post/${id}`, "_blank")}
            disabled={isNew && !isDirty}
          >
            <Eye size={18} />
            Preview
          </button>
          <button
            onClick={handleSubmit((data) => mutation.mutate(data))}
            className="btn btn-primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
            {isNew ? "Publish" : "Save Changes"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>
        {/* Main Editor Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="card" style={{ padding: "32px" }}>
            <div className="form-group" style={{ marginBottom: "24px" }}>
              <input
                className="form-input"
                placeholder="Entry Title"
                {...register("title")}
                style={{
                  fontSize: "2.25rem",
                  fontWeight: 800,
                  background: "transparent",
                  border: "none",
                  padding: "0",
                  height: "auto",
                  letterSpacing: "-0.03em",
                }}
              />
              {errors.title && <span className="form-error">{errors.title.message}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-tertiary)", fontSize: "0.875rem" }}>
                <Globe size={14} />
                <span>slug:</span>
                <input
                  className="form-input"
                  {...register("slug")}
                  style={{
                    fontSize: "0.875rem",
                    background: "transparent",
                    border: "none",
                    padding: "2px 0",
                    height: "auto",
                    width: "auto",
                    minWidth: "200px",
                    color: "var(--accent-secondary)",
                  }}
                />
              </div>
              {errors.slug && <span className="form-error">{errors.slug.message}</span>}
            </div>

            <RichTextEditor
              content={currentContent || ""}
              onChange={(html) => setValue("content", html, { shouldDirty: true })}
            />
            {errors.content && <span className="form-error">{errors.content.message}</span>}
          </div>

          {/* Excerpt Card */}
          <div className="card">
            <label className="form-label" style={{ marginBottom: "12px", display: "block" }}>
              Post Excerpt
            </label>
            <textarea
              className="form-textarea"
              placeholder="Brief summary for social sharing and listings..."
              {...register("excerpt")}
            />
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px" }}>
              Summaries appear in search results and social cards.
            </p>
          </div>
        </div>

        {/* Sidebar Settings Section */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Status & Privacy */}
          <div className="card">
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Settings size={16} />
              Publish Status
            </h3>
            <div className="form-group">
              <select className="form-select" {...register("status")}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          {/* Featured Image */}
          <div className="card">
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ImageIcon size={16} />
              Featured Image
            </h3>
            {watch("coverImage") ? (
              <div style={{ position: "relative", marginBottom: "12px" }}>
                <img
                  src={watch("coverImage") || ""}
                  alt="Post cover"
                  style={{ width: "100%", borderRadius: "8px", aspectRatio: "16/9", objectFit: "cover" }}
                />
                <button
                  onClick={() => setValue("coverImage", "")}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    background: "rgba(0,0,0,0.6)",
                    border: "none",
                    borderRadius: "50%",
                    padding: "4px",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <ImageUpload
                onUpload={(url) => setValue("coverImage", url)}
                style={{
                  width: "100%",
                  aspectRatio: "16/9",
                  border: "2px dashed var(--border-secondary)",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <Plus size={24} />
                <span style={{ fontSize: "0.75rem" }}>Set Featured Image</span>
              </ImageUpload>
            )}
            <input
              type="text"
              className="form-input"
              style={{ marginTop: "12px", fontSize: "0.75rem" }}
              placeholder="Or paste URL here..."
              {...register("coverImage")}
            />
          </div>

          {/* Category & Tags */}
          <div className="card">
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "16px" }}>Classification</h3>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" {...register("categoryId")}>
                <option value="">No Category</option>
                {categories?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginTop: "12px" }}>
              <label className="form-label">Tags (comma separated)</label>
              <input
                className="form-input"
                placeholder="news, technology, update"
                onChange={(e) => {
                  const tags = e.target.value.split(",").map((t) => t.trim()).filter(Boolean);
                  setValue("tags", tags);
                }}
                defaultValue={post?.tags?.map((t: any) => t.name).join(", ")}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
