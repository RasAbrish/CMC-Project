"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  FileText,
  File,
  ImageIcon,
  Users,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  Activity,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface DashboardStats {
  posts: { total: number; published: number; draft: number };
  pages: number;
  media: number;
  users: number;
  activityTimeline?: Array<{ date: string; total: number }>;
  recentPosts: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    author: { name: string };
  }>;
  recentPages: Array<{
    id: string;
    title: string;
    status: string;
    updatedAt: string;
    author: { name: string };
  }>;
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <div className="skeleton" style={{ width: "200px", height: "32px", marginBottom: "8px" }} />
            <div className="skeleton" style={{ width: "300px", height: "18px" }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: "140px" }} />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      icon: FileText,
      label: "Total Posts",
      value: stats?.posts.total || 0,
      sub: `${stats?.posts.published || 0} published · ${stats?.posts.draft || 0} drafts`,
      color: "#6366f1",
    },
    {
      icon: File,
      label: "Pages",
      value: stats?.pages || 0,
      sub: "Active site pages",
      color: "#8b5cf6",
    },
    {
      icon: ImageIcon,
      label: "Media Files",
      value: stats?.media || 0,
      sub: "Images, videos & files",
      color: "#a78bfa",
    },
    {
      icon: Users,
      label: "Users",
      value: stats?.users || 0,
      sub: "Team members",
      color: "#c084fc",
    },
  ];

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Activity size={28} style={{ color: "var(--accent-primary)" }} />
            Dashboard
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", marginTop: "4px" }}>
            Overview of your content management system
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/dashboard/posts/new" className="btn btn-primary" style={{ textDecoration: "none" }}>
            <Plus size={18} />
            New Post
          </Link>
          <Link href="/dashboard/pages/new" className="btn btn-secondary" style={{ textDecoration: "none" }}>
            <Plus size={18} />
            New Page
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="stat-icon" style={{ background: `${card.color}15`, color: card.color }}>
              <card.icon size={22} />
            </div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px" }}>
              {card.sub}
            </p>
          </div>
        ))}
      </div>

{/* Quick Actions & Overview */}
      <div className="card" style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>System Overview</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "2px" }}>Quick actions and insights</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          <Link href="/dashboard/banners" className="nav-item" style={{ margin: 0, padding: "16px", border: "1px solid var(--border-secondary)", background: "var(--bg-tertiary)" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(99, 102, 241, 0.15)", color: "var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ImageIcon size={18} />
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)" }}>Manage Banners</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Update homepage carousel</p>
            </div>
          </Link>
          
          <Link href="/dashboard/menus" className="nav-item" style={{ margin: 0, padding: "16px", border: "1px solid var(--border-secondary)", background: "var(--bg-tertiary)" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={18} />
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)" }}>Edit Navigation</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Modify headers and footer links</p>
            </div>
          </Link>

          {(stats?.posts?.draft ?? 0) > 0 && (
            <Link href="/dashboard/posts" className="nav-item" style={{ margin: 0, padding: "16px", border: "1px solid var(--border-secondary)", background: "var(--bg-tertiary)" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={18} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)" }}>Review Drafts</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>You have {stats?.posts.draft} unpublished drafts</p>
              </div>
            </Link>
          )}

          <Link href="/dashboard/users" className="nav-item" style={{ margin: 0, padding: "16px", border: "1px solid var(--border-secondary)", background: "var(--bg-tertiary)" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={18} />
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)" }}>Team Activity</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Oversee your {stats?.users} team members</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Recent Posts */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={18} style={{ color: "var(--accent-primary)" }} />
              Recent Posts
            </h3>
            <Link
              href="/dashboard/posts"
              style={{
                fontSize: "0.8125rem",
                color: "var(--accent-secondary)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {stats?.recentPosts && stats.recentPosts.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "350px", overflowY: "auto", paddingRight: "4px" }}>
              {stats.recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/dashboard/posts/${post.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "background 0.15s ease",
                  }}
                  className="nav-item"
                >
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{post.title}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      by {post.author.name} · {formatDate(post.createdAt)}
                    </p>
                  </div>
                  <span className={`badge badge-${post.status.toLowerCase()}`}>{post.status}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", padding: "24px" }}>
              No posts yet
            </p>
          )}
        </div>

        {/* Recent Pages */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingUp size={18} style={{ color: "var(--accent-primary)" }} />
              Recent Pages
            </h3>
            <Link
              href="/dashboard/pages"
              style={{
                fontSize: "0.8125rem",
                color: "var(--accent-secondary)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {stats?.recentPages && stats.recentPages.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "350px", overflowY: "auto", paddingRight: "4px" }}>
              {stats.recentPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/dashboard/pages/${page.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "background 0.15s ease",
                  }}
                  className="nav-item"
                >
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{page.title}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      by {page.author.name} · {formatDate(page.updatedAt)}
                    </p>
                  </div>
                  <span className={`badge badge-${page.status.toLowerCase()}`}>{page.status}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", padding: "24px" }}>
              No pages yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
