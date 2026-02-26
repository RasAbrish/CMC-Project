"use client";

import { useSidebarStore } from "@/store/sidebar-store";
import { useSession } from "@/lib/auth-client";
import { Menu, Bell, Search, X, Check, CheckCheck, FileText, File, Users, Image as ImageIcon } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unread: number;
}

function NotificationIcon({ type }: { type: string }) {
  const iconStyle = { width: 14, height: 14 };
  if (type.startsWith("POST")) return <FileText style={iconStyle} />;
  if (type.startsWith("PAGE")) return <File style={iconStyle} />;
  if (type === "USER_JOINED") return <Users style={iconStyle} />;
  if (type === "MEDIA_UPLOADED") return <ImageIcon style={iconStyle} />;
  return <Bell style={iconStyle} />;
}

function typeColor(type: string): string {
  if (type === "POST_CREATED") return "#6366f1";
  if (type === "POST_UPDATED") return "#8b5cf6";
  if (type === "POST_DELETED") return "#ef4444";
  if (type === "PAGE_CREATED") return "#06b6d4";
  if (type === "PAGE_UPDATED") return "#0ea5e9";
  if (type === "USER_JOINED") return "#10b981";
  if (type === "MEDIA_UPLOADED") return "#f59e0b";
  return "#6366f1";
}

export function Header() {
  const { isOpen, toggle } = useSidebarStore();
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const router = useRouter();
  const { data: notifData } = useQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) return { notifications: [], unread: 0 };
      return res.json();
    },
    enabled: !!session,
    refetchInterval: 30000, // poll every 30s
    staleTime: 15000,
  });

  const markAllMutation = useMutation({
    mutationFn: () =>
      fetch("/api/notifications/read-all", { method: "PUT" }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/notifications/${id}/read`, { method: "PUT" }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Close dropdown when clicking outside
  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
      setNotifOpen(false);
    }
  }, []);

  useEffect(() => {
    if (notifOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [notifOpen, handleOutsideClick]);

  const notifications = notifData?.notifications ?? [];
  const unread = notifData?.unread ?? 0;

  return (
    <header className="h-[64px] bg-[var(--bg-secondary)] border-b border-[var(--border-secondary)] sticky top-0 z-30 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={toggle}
          className="btn-ghost"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-secondary)",
            padding: "8px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
          }}
          title="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>

        <button
          onClick={() => router.back()}
          className="btn-ghost"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-secondary)",
            padding: "8px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
          title="Go Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>

        {searchOpen && (
          <div className="relative animate-slideDown">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              className="w-[200px] md:w-[300px] h-[38px] pl-10 pr-4 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-glow)] transition-all"
              placeholder="Search posts..."
              autoFocus
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.currentTarget.value.trim();
                  if (val) {
                    router.push(`/dashboard/posts?q=${encodeURIComponent(val)}`);
                  }
                  setSearchOpen(false);
                }
              }}
            />
          </div>
        )}

        {!searchOpen && (
          <button
            onClick={() => setSearchOpen(true)}
            className="btn-ghost"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "8px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.8125rem",
            }}
          >
            <Search size={16} />
            <span style={{ color: "var(--text-muted)" }}>Search...</span>
          </button>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <ThemeToggle />

        {/* Notification Bell */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            className="btn-ghost"
            onClick={() => setNotifOpen((v) => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: unread > 0 ? "var(--accent-primary)" : "var(--text-secondary)",
              padding: "8px",
              borderRadius: "8px",
              position: "relative",
              transition: "color 0.2s",
            }}
            title="Notifications"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  minWidth: "16px",
                  height: "16px",
                  borderRadius: "999px",
                  background: "#ef4444",
                  color: "white",
                  fontSize: "0.625rem",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 3px",
                  lineHeight: 1,
                  border: "2px solid var(--bg-secondary)",
                }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div
              className="animate-slideDown"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: "360px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-primary)",
                borderRadius: "14px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                zIndex: 1000,
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 18px 12px",
                  borderBottom: "1px solid var(--border-secondary)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Notifications</h3>
                  {unread > 0 && (
                    <span
                      style={{
                        background: "rgba(99,102,241,0.15)",
                        color: "var(--accent-primary)",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: "999px",
                      }}
                    >
                      {unread} new
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {unread > 0 && (
                    <button
                      onClick={() => markAllMutation.mutate()}
                      title="Mark all as read"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <CheckCheck size={14} />
                      All read
                    </button>
                  )}
                  <button
                    onClick={() => setNotifOpen(false)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      padding: "4px",
                      borderRadius: "6px",
                      display: "flex",
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Notifications list */}
              <div style={{ maxHeight: "380px", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    <Bell
                      size={28}
                      style={{ marginBottom: "12px", opacity: 0.4 }}
                    />
                    <p style={{ fontSize: "0.875rem" }}>Nothing new yet</p>
                    <p style={{ fontSize: "0.75rem", marginTop: "4px" }}>
                      You&apos;ll see activity from your team here
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        display: "flex",
                        gap: "12px",
                        padding: "12px 18px",
                        borderBottom: "1px solid var(--border-secondary)",
                        background: n.read ? "transparent" : "rgba(99,102,241,0.04)",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onClick={() => {
                        if (!n.read) markOneMutation.mutate(n.id);
                        if (n.link) window.location.href = n.link;
                        else setNotifOpen(false);
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          minWidth: "32px",
                          borderRadius: "8px",
                          background: `${typeColor(n.type)}18`,
                          color: typeColor(n.type),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: "2px",
                        }}
                      >
                        <NotificationIcon type={n.type} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: "0.8125rem",
                            fontWeight: n.read ? 500 : 700,
                            marginBottom: "2px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {n.title}
                        </p>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            lineHeight: 1.4,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical" as const,
                          }}
                        >
                          {n.message}
                        </p>
                        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px" }}>
                          {formatDate(n.createdAt)}
                        </p>
                      </div>

                      {/* Unread dot + check */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: "6px",
                        }}
                      >
                        {!n.read && (
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "var(--accent-primary)",
                              flexShrink: 0,
                              marginTop: "4px",
                            }}
                          />
                        )}
                        {n.read && <Check size={12} style={{ color: "var(--text-muted)" }} />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {session && (
          <Link
            href="/dashboard/profile"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 12px 6px 6px",
              borderRadius: "10px",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-secondary)",
              cursor: "pointer",
            }}
            aria-label="Open profile settings"
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--accent-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 700,
                fontSize: "0.8125rem",
                overflow: "hidden",
              }}
            >
              {(session.user as { image?: string }).image ? (
                <img
                  src={(session.user as { image?: string }).image}
                  alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                session.user.name?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>
            <div>
              <p style={{ fontSize: "0.8125rem", fontWeight: 600, lineHeight: 1.2 }}>
                {session.user.name}
              </p>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", lineHeight: 1.2 }}>
                {(session.user as { role?: string })?.role || "EDITOR"}
              </p>
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
