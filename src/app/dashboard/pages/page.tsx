"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  File,
  Lock,
} from "lucide-react";

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string;
  updatedAt: string;
  author: { id: string; name: string };
}

export default function PagesPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [search, setSearch] = useState("");

  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  const { data: pages, isLoading } = useQuery({
    queryKey: ["pages", search],
    queryFn: async () => {
      const res = await fetch(`/api/pages${search ? `?search=${search}` : ""}`);
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/pages/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Delete failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast.success("Page deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete page"),
  });

  const canEdit = (page: Page) => isAdmin || page.author.id === session?.user.id;
  const canDelete = (page: Page) => isAdmin || page.author.id === session?.user.id;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pages</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Structure your website architecture
            {!isAdmin && (
              <span style={{ marginLeft: "8px", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                · You can only edit &amp; delete your own pages
              </span>
            )}
          </p>
        </div>
        <Link href="/dashboard/pages/new" className="btn btn-primary" style={{ textDecoration: "none" }}>
          <Plus size={18} />
          New Page
        </Link>
      </div>

      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="search-box">
          <Search size={16} />
          <input
            className="form-input"
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "40px" }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "32px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: "60px", marginBottom: "8px" }} />
            ))}
          </div>
        ) : pages?.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Page Title</th>
                <th>Author</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th style={{ width: "120px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page: Page) => (
                <tr key={page.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <File size={16} color="var(--accent-secondary)" />
                      <div>
                        <Link
                          href={`/dashboard/pages/${page.id}`}
                          style={{ fontWeight: 600, color: "var(--text-primary)", textDecoration: "none" }}
                        >
                          {page.title}
                        </Link>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/{page.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {page.author.name}
                    {page.author.id === session?.user.id && (
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: "4px" }}>(you)</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${page.status.toLowerCase()}`}>{page.status}</span>
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                    {formatDate(page.updatedAt)}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {canEdit(page) ? (
                        <Link
                          href={`/dashboard/pages/${page.id}`}
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
                      {canDelete(page) ? (
                        <button
                          className="btn btn-ghost btn-icon"
                          style={{ color: "var(--danger)" }}
                          onClick={() => {
                            toast(`Delete "${page.title}"?`, {
                              action: { label: "Delete", onClick: () => deleteMutation.mutate(page.id) },
                              cancel: { label: "Cancel", onClick: () => {} },
                            });
                          }}
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
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <File size={32} />
            </div>
            <h3 className="empty-state-title">No pages created</h3>
            <p className="empty-state-desc">You haven&apos;t created any static pages yet.</p>
            <Link href="/dashboard/pages/new" className="btn btn-primary" style={{ marginTop: "16px", textDecoration: "none" }}>
              <Plus size={18} /> New Page
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
