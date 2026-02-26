"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pageSchema, type PageFormData } from "@/lib/validations";
import { toast } from "sonner";
import { 
  ChevronLeft, 
  Save, 
  Eye, 
  Globe, 
  Settings, 
  X,
  Loader2,
  FileText,
  Search
} from "lucide-react";
import Link from "next/link";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { slugify } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function PageEditorPage() {
  const { id } = useParams() as { id?: string };
  const isNew = id === "new";
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: page, isLoading: isFetching } = useQuery({
    queryKey: ["pages", id],
    queryFn: async () => {
      if (isNew) return null;
      const res = await fetch(`/api/pages/${id}`);
      if (!res.ok) throw new Error("Page not found");
      return res.json();
    },
    enabled: !isNew,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<PageFormData>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      status: "DRAFT",
    },
  });

  const title = watch("title");
  const slug = watch("slug");
  const currentContent = watch("content");

  useEffect(() => {
    if (page) {
      reset({
        title: page.title,
        slug: page.slug,
        content: page.content,
        status: page.status,
        metaTitle: page.metaTitle || "",
        metaDesc: page.metaDesc || "",
      });
    }
  }, [page, reset]);

  useEffect(() => {
    if (isNew && title && !slug) {
      setValue("slug", slugify(title));
    }
  }, [title, isNew, setValue, slug]);

  const mutation = useMutation({
    mutationFn: async (data: PageFormData) => {
      const url = isNew ? "/api/pages" : `/api/pages/${id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast.success(isNew ? "Page created!" : "Page updated!");
      if (isNew) router.push(`/dashboard/pages/${data.id}`);
    },
  });

  if (!isNew && isFetching) return <div style={{ padding: "100px", textAlign: "center" }}><Loader2 className="spinner" size={40} /></div>;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/dashboard/pages" className="btn btn-ghost btn-icon" style={{ textDecoration: "none" }}><ChevronLeft size={20} /></Link>
          <div>
            <h1 className="page-title">{isNew ? "New Page" : "Edit Page"}</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Create static site content</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleSubmit(data => mutation.mutate(data))} className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
            {isNew ? "Create Page" : "Save Changes"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>
        <div className="card" style={{ padding: "32px" }}>
          <div className="form-group" style={{ marginBottom: "24px" }}>
            <input 
              className="form-input" 
              placeholder="Page Title" 
              {...register("title")}
              style={{ fontSize: "2rem", fontWeight: 800, background: "transparent", border: "none", padding: "0" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-tertiary)", fontSize: "0.875rem", marginBottom: "24px" }}>
             <Globe size={14} /> /<input className="form-input" {...register("slug")} style={{ background: "transparent", border: "none", padding: 0, width: "auto", color: "var(--accent-secondary)" }} />
          </div>

          <RichTextEditor content={currentContent || ""} onChange={html => setValue("content", html, { shouldDirty: true })} />
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="card">
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "16px" }}>Status</h3>
            <select className="form-select" {...register("status")}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="card">
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "16px" }}>Search Engine (SEO)</h3>
            <div className="form-group">
              <label className="form-label">Meta Title</label>
              <input className="form-input" placeholder="Page title in search" {...register("metaTitle")} />
            </div>
            <div className="form-group" style={{ marginTop: "12px" }}>
              <label className="form-label">Meta Description</label>
              <textarea className="form-textarea" placeholder="Brief summary for search results..." {...register("metaDesc")} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
