"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { 
  Upload, 
  Search, 
  Filter, 
  Trash2, 
  Info, 
  FileIcon, 
  FileText, 
  Video, 
  ImageIcon,
  X,
  Plus,
  Loader2,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { formatFileSize, formatDate } from "@/lib/utils";

interface MediaFile {
  id: string;
  name: string;
  originalName: string;
  url: string;
  type: string;
  size: number;
  mimeType: string;
  alt: string | null;
  createdAt: string;
  uploadedBy: { name: string };
}

export default function MediaLibraryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["media", search, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`/api/media?${params}`);
      return res.json();
    },
  });

  const selectedFile = data?.files?.find((f: MediaFile) => f.id === selectedId);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      toast.success("File uploaded successfully");
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => setIsUploading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      setSelectedId(null);
      toast.success("File deleted");
    },
  });

  const updateAltMutation = useMutation({
    mutationFn: async ({ id, alt }: { id: string; alt: string }) => {
      const res = await fetch(`/api/media/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ alt }),
        headers: { "Content-Type": "application/json" },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      toast.success("Alt text updated");
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      uploadMutation.mutate(file);
    }
  };

  const truncateName = (name: string, len = 20) => {
    if (name.length <= len) return name;
    return name.substring(0, len) + "...";
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Media Library</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Upload and manage your images, videos and assets
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          {isUploading ? <Loader2 size={18} className="spinner" /> : <Plus size={18} />}
          Upload File
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: "none" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", height: "calc(100vh - 200px)" }}>
        {/* Gallery Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="card" style={{ display: "flex", gap: "12px" }}>
            <div className="search-box" style={{ flex: 1 }}>
              <Search size={16} />
              <input 
                className="form-input" 
                placeholder="Search media..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "40px" }}
              />
            </div>
            <select className="form-select" style={{ width: "160px" }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="file">Files</option>
            </select>
          </div>

          <div 
            className="card" 
            style={{ 
              flex: 1, 
              overflowY: "auto", 
              padding: "20px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "16px",
              alignContent: "start"
            }}
          >
            {isLoading ? (
              Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ aspectRatio: "1", borderRadius: "12px" }} />
              ))
            ) : data?.files?.map((file: MediaFile) => (
              <div 
                key={file.id} 
                className={`media-item ${selectedId === file.id ? "selected" : ""}`}
                onClick={() => setSelectedId(file.id)}
              >
                {file.type === "image" ? (
                  <img src={file.url} alt={file.name} />
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-active)" }}>
                    {file.type === "video" ? <Video size={32} color="var(--text-muted)" /> : <FileIcon size={32} color="var(--text-muted)" />}
                  </div>
                )}
                <div className="media-item-info">
                  <p style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {truncateName(file.originalName)}
                  </p>
                </div>
                {selectedId === file.id && (
                  <div style={{ position: "absolute", top: "8px", right: "8px", background: "var(--accent-primary)", borderRadius: "50%", color: "white", padding: "2px" }}>
                    <Check size={12} strokeWidth={4} />
                  </div>
                )}
              </div>
            ))}
            {!isLoading && data?.files?.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "100px 0" }}>
                <ImageIcon size={48} color="var(--text-muted)" style={{ marginBottom: "16px" }} />
                <p style={{ color: "var(--text-muted)" }}>No media found</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Sidebar */}
        <aside className="card" style={{ padding: "24px", overflowY: "auto" }}>
          {selectedFile ? (
            <div className="animate-slideUp">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>File Details</h3>
                <button className="btn-ghost" onClick={() => setSelectedId(null)}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ borderRadius: "12px", overflow: "hidden", background: "var(--bg-active)", marginBottom: "20px", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {selectedFile.type === "image" ? (
                  <img src={selectedFile.url} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt="Preview" />
                ) : selectedFile.type === "video" ? (
                  <Video size={64} color="var(--text-muted)" />
                ) : (
                  <FileIcon size={64} color="var(--text-muted)" />
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                <div>
                  <label className="form-label" style={{ fontSize: "0.7rem" }}>Original Name</label>
                  <p style={{ fontSize: "0.875rem", wordBreak: "break-all" }}>{selectedFile.originalName}</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="form-label" style={{ fontSize: "0.7rem" }}>Size</label>
                    <p style={{ fontSize: "0.875rem" }}>{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: "0.7rem" }}>Type</label>
                    <p style={{ fontSize: "0.875rem", textTransform: "capitalize" }}>{selectedFile.type}</p>
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: "0.7rem" }}>Uploaded At</label>
                  <p style={{ fontSize: "0.875rem" }}>{formatDate(selectedFile.createdAt)}</p>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: "0.7rem" }}>Public URL</label>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <input className="form-input" style={{ fontSize: "0.75rem" }} value={selectedFile.url} readOnly />
                    <button className="btn btn-secondary btn-icon" onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + selectedFile.url);
                      toast.success("URL copied");
                    }}>
                      <FileText size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label className="form-label">Alt Text</label>
                <input 
                  className="form-input" 
                  defaultValue={selectedFile.alt || ""} 
                  onBlur={(e) => updateAltMutation.mutate({ id: selectedFile.id, alt: e.target.value })}
                  placeholder="Describe this asset..."
                />
              </div>

              <button 
                className="btn btn-danger" 
                style={{ width: "100%" }}
                onClick={() => {
                  toast("Delete this asset permanently?", {
                    action: { label: "Delete", onClick: () => deleteMutation.mutate(selectedFile.id) },
                    cancel: { label: "Cancel", onClick: () => {} }
                  });
                }}
              >
                <Trash2 size={16} />
                Delete Asset
              </button>
            </div>
          ) : (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: "var(--text-muted)" }}>
              <Info size={40} strokeWidth={1} style={{ marginBottom: "16px opacity: 0.5" }} />
              <p style={{ fontSize: "0.875rem" }}>Select an asset to view details</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
