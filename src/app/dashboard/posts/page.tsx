"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatDate, truncate } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  FileText,
  Filter,
  Lock,
} from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  createdAt: string;
  author: { id: string; name: string };
  category: { id: string; name: string } | null;
}

function PostsContent() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  
  // Sync if URL search changes externally (e.g. from header)
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null && q !== search) {
      setSearch(q);
      setPage(1);
    }
  }, [searchParams]);

  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  const { data, isLoading } = useQuery({
    queryKey: ["posts", page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: "10" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/posts?${params}`);
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete post"),
  });

  const handleDelete = (id: string, title: string) => {
    toast(`Delete "${title}"? This action cannot be undone.`, {
      action: { label: "Delete", onClick: () => deleteMutation.mutate(id) },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  const canEdit = (post: Post) => isAdmin || post.author.id === session?.user.id;
  const canDelete = (post: Post) => isAdmin || post.author.id === session?.user.id;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Posts</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "4px" }}>
            Manage blog posts and articles
            {!isAdmin && (
              <span style={{ marginLeft: "8px", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                · You can only edit &amp; delete your own posts
              </span>
            )}
          </p>
        </div>
        <Link href="/dashboard/posts/new" className="btn btn-primary" style={{ textDecoration: "none" }}>
          <Plus size={18} />
          New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: "24px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <div className="search-box" style={{ flex: 1, minWidth: "200px" }}>
          <Search size={16} />
          <input
            className="form-input"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: "40px" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={16} style={{ color: "var(--text-muted)" }} />
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ width: "160px" }}
          >
            <option value="">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "32px" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton" style={{ height: "56px", marginBottom: "8px" }} />
            ))}
          </div>
        ) : data?.posts?.length > 0 ? (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ width: "100px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.posts.map((post: Post) => (
                  <tr key={post.id}>
                    <td>
                      <Link
                        href={`/dashboard/posts/${post.id}`}
                        style={{ color: "var(--text-primary)", textDecoration: "none", fontWeight: 600 }}
                      >
                        {truncate(post.title, 50)}
                      </Link>
                      {post.excerpt && (
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {truncate(post.excerpt, 80)}
                        </p>
                      )}
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {post.author.name}
                      {post.author.id === session?.user.id && (
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: "4px" }}>(you)</span>
                      )}
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{post.category?.name || "—"}</td>
                    <td>
                      <span className={`badge badge-${post.status.toLowerCase()}`}>{post.status}</span>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                      {formatDate(post.createdAt)}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {canEdit(post) ? (
                          <Link
                            href={`/dashboard/posts/${post.id}`}
                            className="btn btn-ghost btn-icon"
                            style={{ textDecoration: "none" }}
                            title="Edit"
                          >
                            <Edit3 size={15} />
                          </Link>
                        ) : (
                          <span
                            className="btn btn-ghost btn-icon"
                            title="No permission to edit"
                            style={{ opacity: 0.3, cursor: "not-allowed" }}
                          >
                            <Lock size={15} />
                          </span>
                        )}
                        {canDelete(post) ? (
                          <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => handleDelete(post.id, post.title)}
                            style={{ color: "var(--danger)" }}
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : (
                          <span
                            className="btn btn-ghost btn-icon"
                            title="No permission to delete"
                            style={{ opacity: 0.3, cursor: "not-allowed" }}
                          >
                            <Lock size={15} />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {data.total > 10 && (
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", padding: "16px" }}>
                <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Previous
                </button>
                <span style={{ padding: "6px 16px", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  Page {page} of {Math.ceil(data.total / 10)}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page >= Math.ceil(data.total / 10)}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={32} />
            </div>
            <h3 className="empty-state-title">No posts found</h3>
            <p className="empty-state-desc">Create your first post to get started with publishing content.</p>
            <Link href="/dashboard/posts/new" className="btn btn-primary" style={{ marginTop: "16px", textDecoration: "none" }}>
              <Plus size={18} />
              Create Post
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PostsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><div className="spinner mx-auto" /></div>}>
      <PostsContent />
    </Suspense>
  );
}
