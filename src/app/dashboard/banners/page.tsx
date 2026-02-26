"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Edit3, Flag, Image as ImageIcon, Link as LinkIcon, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { bannerSchema, type BannerFormData } from "@/lib/validations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageUpload } from "@/components/image-upload";

export default function BannersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: banners, isLoading } = useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const res = await fetch("/api/banners");
      return res.json();
    },
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: { isActive: true, order: 0, position: "hero" }
  });

  const mutation = useMutation({
    mutationFn: async (data: BannerFormData) => {
      const url = editingId ? `/api/banners/${editingId}` : "/api/banners";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success(editingId ? "Banner updated" : "Banner created");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save banner");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/banners/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner removed");
    },
  });

  const openModal = (banner?: any) => {
    if (banner) {
      setEditingId(banner.id);
      reset({
        title: banner.title,
        subtitle: banner.subtitle || "",
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl || "",
        linkText: banner.linkText || "",
        position: banner.position,
        isActive: banner.isActive,
        order: banner.order,
      });
    } else {
      setEditingId(null);
      reset({ isActive: true, order: 0, position: "hero" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    reset();
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Banners</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Promote content on your homepage and landing pages
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          Add Banner
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: "240px", borderRadius: "16px" }} />)
        ) : banners?.map((banner: any) => (
          <div key={banner.id} className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "relative", height: "160px" }}>
              <img src={banner.imageUrl} alt={banner.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", gap: "6px" }}>
                <span className={`badge ${banner.isActive ? "badge-published" : "badge-archived"}`} style={{ backdropFilter: "blur(8px)" }}>
                  {banner.isActive ? "Active" : "Hidden"}
                </span>
              </div>
            </div>
            <div style={{ padding: "20px", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>{banner.title}</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>#{banner.order}</span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "16px", lineBreak: "anywhere" }}>
                {banner.subtitle || "No subtitle"}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid var(--border-secondary)" }}>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button className="btn btn-ghost btn-icon" onClick={() => openModal(banner)}><Edit3 size={15} /></button>
                  <button className="btn btn-ghost btn-icon" style={{ color: "var(--danger)" }} onClick={() => {
                    toast("Remove banner?", {
                      action: { label: "Delete", onClick: () => deleteMutation.mutate(banner.id) },
                      cancel: { label: "Cancel", onClick: () => {} }
                    });
                  }}><Trash2 size={15} /></button>
                </div>
                {banner.linkUrl && (
                  <a 
                    href={banner.linkUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ fontSize: "0.7rem", color: "var(--accent-secondary)", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
                    title="Test Link"
                  >
                    <LinkIcon size={12} /> {banner.linkText || "External Link"}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="dialog-overlay" onClick={closeModal}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <div className="dialog-header">
              <h2 className="dialog-title">{editingId ? "Edit Banner" : "New Banner"}</h2>
              <button className="btn-ghost" onClick={closeModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit((data) => mutation.mutate(data))} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">Banner Title</label>
                <input className="form-input" placeholder="e.g. Summer Collection 2024" {...register("title")} />
                {errors.title && <span className="form-error">{errors.title.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Subtitle / Description</label>
                <textarea className="form-textarea" style={{ minHeight: "80px" }} placeholder="Catchy phrase to grab attention..." {...register("subtitle")} />
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input className="form-input" placeholder="https://..." {...register("imageUrl")} style={{ flex: 1 }} />
                  <ImageUpload onUpload={(url) => setValue("imageUrl", url)}>
                    <button type="button" className="btn btn-secondary" style={{ padding: "0 16px", height: "100%" }}>
                      <ImageIcon size={18} />
                    </button>
                  </ImageUpload>
                </div>
                {errors.imageUrl && <span className="form-error">{errors.imageUrl.message}</span>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Link URL</label>
                  <input className="form-input" placeholder="/shop" {...register("linkUrl")} />
                </div>
                <div className="form-group">
                  <label className="form-label">Button Text</label>
                  <input className="form-input" placeholder="Shop Now" {...register("linkText")} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Order</label>
                  <input type="number" className="form-input" {...register("order", { valueAsNumber: true })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <select className="form-select" {...register("position")}>
                    <option value="hero">Hero (Top)</option>
                    <option value="middle">Middle Segment</option>
                    <option value="bottom">Bottom Footer</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                <label className="toggle-switch">
                  <input type="checkbox" {...register("isActive")} />
                  <span className="toggle-slider"></span>
                </label>
                <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Active and Visibility</span>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={mutation.isPending}>
                  {mutation.isPending ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
                  {editingId ? "Update Banner" : "Create Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Re-using icon
function Save({ size }: { size: number }) {
  return <Check size={size} />;
}
