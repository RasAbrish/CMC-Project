"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { useSidebarStore } from "@/store/sidebar-store";
import {
  LayoutDashboard,
  FileText,
  File,
  Image as ImageIcon,
  Flag,
  Menu as MenuIcon,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  Settings,
  UserCircle,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/posts", label: "Posts", icon: FileText },
  { href: "/dashboard/pages", label: "Pages", icon: File },
  { href: "/dashboard/media", label: "Media Library", icon: ImageIcon },
  { href: "/dashboard/banners", label: "Banners", icon: Flag },
  { href: "/dashboard/menus", label: "Menus", icon: MenuIcon },
];

const adminItems = [
  { href: "/dashboard/users", label: "Users", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebarStore();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside 
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[var(--bg-secondary)] border-r border-[var(--border-secondary)] flex flex-col transition-all duration-300 ${isOpen ? "translate-x-0 w-[280px]" : "-translate-x-full md:translate-x-0 md:w-[72px]"}`}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderBottom: "1px solid var(--border-secondary)",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            minWidth: "40px",
            borderRadius: "10px",
            background: "var(--accent-gradient)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
          }}
        >
          <Sparkles size={20} color="white" />
        </div>
        {isOpen && (
          <div style={{ overflow: "hidden" }}>
            <h2
              style={{
                fontSize: "1.125rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                whiteSpace: "nowrap",
                background: "var(--accent-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              CMS Admin
            </h2>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              Content Management
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, paddingTop: "12px", overflowY: "auto" }}>
        <div style={{ marginBottom: "8px" }}>
          {isOpen && (
            <p
              style={{
                padding: "8px 24px",
                fontSize: "0.6875rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Content
            </p>
          )}
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive(item.href) ? "active" : ""}`}
              title={!isOpen ? item.label : undefined}
              style={{
                justifyContent: isOpen ? "flex-start" : "center",
                padding: isOpen ? "10px 16px" : "10px",
              }}
            >
              <item.icon size={20} style={{ minWidth: "20px" }} />
              {isOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </div>

        {/* Profile link — always visible */}
        <div
          style={{
            marginTop: "8px",
            paddingTop: "8px",
            borderTop: "1px solid var(--border-secondary)",
          }}
        >
          {isOpen && (
            <p
              style={{
                padding: "8px 24px",
                fontSize: "0.6875rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Account
            </p>
          )}
          <Link
            href="/dashboard/profile"
            className={`nav-item ${isActive("/dashboard/profile") ? "active" : ""}`}
            title={!isOpen ? "My Profile" : undefined}
            style={{
              justifyContent: isOpen ? "flex-start" : "center",
              padding: isOpen ? "10px 16px" : "10px",
            }}
          >
            <UserCircle size={20} style={{ minWidth: "20px" }} />
            {isOpen && <span>My Profile</span>}
          </Link>
        </div>

        {isAdmin && (
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border-secondary)" }}>
            {isOpen && (
              <p
                style={{
                  padding: "8px 24px",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Administration
              </p>
            )}
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive(item.href) ? "active" : ""}`}
                title={!isOpen ? item.label : undefined}
                style={{
                  justifyContent: isOpen ? "flex-start" : "center",
                  padding: isOpen ? "10px 16px" : "10px",
                }}
              >
                <item.icon size={20} style={{ minWidth: "20px" }} />
                {isOpen && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* User & Collapse */}
      <div style={{ borderTop: "1px solid var(--border-secondary)", padding: "12px" }}>
        {session && isOpen && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px",
              borderRadius: "10px",
              marginBottom: "8px",
              background: "var(--bg-hover)",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                minWidth: "36px",
                borderRadius: "10px",
                background: "var(--accent-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 700,
                fontSize: "0.875rem",
                overflow: "hidden",
              }}
            >
              {(session.user as { image?: string }).image ? (
                <img
                  src={(session.user as { image?: string }).image}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                session.user.name?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <p
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {session.user.name}
              </p>
              <p
                style={{
                  fontSize: "0.6875rem",
                  color: "var(--text-muted)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {(session.user as { role?: string })?.role || "EDITOR"}
              </p>
            </div>
            <button
              onClick={() => signOut().then(() => (window.location.href = "/login"))}
              className="btn-ghost"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "4px",
              }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}

        <button
          onClick={toggle}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "8px",
            borderRadius: "8px",
            background: "none",
            border: "1px solid var(--border-secondary)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "0.75rem",
            transition: "all 0.2s ease",
          }}
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          {isOpen && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
