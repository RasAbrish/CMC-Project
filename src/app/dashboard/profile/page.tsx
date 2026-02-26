"use client";

import { useSession } from "@/lib/auth-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userUpdateSchema, type UserUpdateData } from "@/lib/validations";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Mail,
  Shield,
  Camera,
  KeyRound,
  Eye,
  EyeOff,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/image-upload";

export default function ProfilePage() {
  const { data: session, refetch } = useSession();
  const queryClient = useQueryClient();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UserUpdateData>({
    resolver: zodResolver(userUpdateSchema),
  });

  useEffect(() => {
    if (session?.user) {
      const u = session.user as { image?: string | null; bio?: string };
      setAvatarUrl(u.image ?? null);
      reset({
        name: session.user.name,
        bio: u.bio || "",
        image: u.image || undefined,
      });
    }
  }, [session, reset]);

  const profileMutation = useMutation({
    mutationFn: async (data: UserUpdateData) => {
      const res = await fetch(`/api/users/${session?.user.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      refetch();
      toast.success("Profile updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setPasswordLoading(true);
    try {
      // Use Better Auth's change password endpoint
      const { authClient } = await import("@/lib/auth-client");
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      if ((result as { error?: { message?: string } }).error) {
        const err = (result as { error?: { message?: string } }).error;
        toast.error(err?.message || "Failed to change password");
      } else {
        toast.success("Password changed successfully!");
        setShowPasswordForm(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast.error("Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!session) return null;

  const userWithExtras = session.user as { role?: string; bio?: string; image?: string | null };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <User size={26} style={{ color: "var(--accent-primary)" }} />
            My Profile
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "4px" }}>
            Manage your personal profile, avatar, and account security
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "760px", display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Profile Card */}
        <div className="card">
          {/* Avatar + name header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              marginBottom: "32px",
              paddingBottom: "24px",
              borderBottom: "1px solid var(--border-secondary)",
              flexWrap: "wrap",
            }}
          >
            <ImageUpload
              onUpload={(url) => {
                setAvatarUrl(url);
                setValue("image", url, { shouldDirty: true });
              }}
              style={{
                width: "88px",
                height: "88px",
                borderRadius: "22px",
                overflow: "hidden",
                position: "relative",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <>
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "var(--accent-gradient)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2.25rem",
                    fontWeight: 800,
                    color: "white",
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    session.user.name?.charAt(0)?.toUpperCase()
                  )}
                </div>
                <div
                  style={{
                    position: "absolute",
                    right: 4,
                    bottom: 4,
                    width: 26,
                    height: 26,
                    borderRadius: "999px",
                    background: "rgba(0,0,0,0.75)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    border: "1.5px solid rgba(255,255,255,0.4)",
                  }}
                >
                  <Camera size={13} />
                </div>
              </>
            </ImageUpload>

            <div>
              <h2 style={{ fontSize: "1.375rem", fontWeight: 800, marginBottom: "4px" }}>
                {session.user.name}
              </h2>
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Mail size={13} />
                  {session.user.email}
                </span>
                <span
                  className={`badge ${userWithExtras.role === "ADMIN" ? "badge-admin" : "badge-editor"}`}
                  style={{ fontSize: "0.7rem", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <Shield size={11} />
                  {userWithExtras.role || "EDITOR"}
                </span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px" }}>
                Click the avatar to upload a new profile photo
              </p>
            </div>
          </div>

          {/* Profile form */}
          <form
            onSubmit={handleSubmit((data) => profileMutation.mutate(data))}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input className="form-input" {...register("name")} placeholder="Your full name" />
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                value={session.user.email}
                disabled
                style={{ opacity: 0.6, cursor: "not-allowed" }}
              />
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Email cannot be changed. Contact an administrator if needed.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Bio / About</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: "110px" }}
                placeholder="A short description about yourself..."
                {...register("bio")}
              />
              {errors.bio && <span className="form-error">{errors.bio.message}</span>}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={profileMutation.isPending || !isDirty}
                style={{ padding: "11px 28px" }}
              >
                {profileMutation.isPending ? (
                  <Loader2 size={18} className="spinner" />
                ) : (
                  <Save size={18} />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: showPasswordForm ? "24px" : "0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(139,92,246,0.12)",
                  color: "#8b5cf6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <KeyRound size={18} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Password & Security</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Change your account password
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowPasswordForm((v) => !v)}
              style={{ padding: "8px 16px", fontSize: "0.8125rem" }}
            >
              {showPasswordForm ? "Cancel" : "Change Password"}
            </button>
          </div>

          {showPasswordForm && (
            <form
              onSubmit={handlePasswordChange}
              style={{ display: "flex", flexDirection: "column", gap: "18px" }}
            >
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showCurrent ? "text" : "password"}
                    className="form-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Your current password"
                    style={{ paddingRight: "44px" }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showNew ? "text" : "password"}
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={passwordLoading}
                  style={{ padding: "11px 28px" }}
                >
                  {passwordLoading ? (
                    <Loader2 size={18} className="spinner" />
                  ) : (
                    <KeyRound size={18} />
                  )}
                  Update Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
