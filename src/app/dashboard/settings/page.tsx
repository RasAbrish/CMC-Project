"use client";

import { useSession } from "@/lib/auth-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userUpdateSchema, type UserUpdateData } from "@/lib/validations";
import { toast } from "sonner";
import { Save, Loader2, Mail, Shield, Camera } from "lucide-react";
import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/image-upload";

export default function SettingsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UserUpdateData>({
    resolver: zodResolver(userUpdateSchema),
  });

  useEffect(() => {
    if (session?.user) {
      const userWithExtras = session.user as any;
      const initialImage = userWithExtras.image ?? null;
      setAvatarUrl(initialImage);
      reset({
        name: session.user.name,
        bio: userWithExtras.bio || "",
        image: initialImage || undefined,
      });
    }
  }, [session, reset]);

  const mutation = useMutation({
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
      toast.success("Profile updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (!session) return null;

  const userWithExtras = session.user as any;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Account Settings</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Manage your personal profile and account appearance
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "800px" }}>
        <div className="card">
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
                width: "80px",
                height: "80px",
                borderRadius: "20px",
                overflow: "hidden",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <>
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "20px",
                    background: "var(--accent-gradient)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem",
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
                    session.user.name?.charAt(0)
                  )}
                </div>
                <div
                  style={{
                    position: "absolute",
                    right: 4,
                    bottom: 4,
                    width: 24,
                    height: 24,
                    borderRadius: "999px",
                    background: "rgba(0,0,0,0.75)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.4)",
                  }}
                >
                  <Camera size={14} />
                </div>
              </>
            </ImageUpload>

            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>{session.user.name}</h2>
              <div style={{ display: "flex", gap: "16px", marginTop: "4px", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Mail size={14} /> {session.user.email}
                </span>
                <span
                  className={`badge ${
                    userWithExtras.role === "ADMIN" ? "badge-admin" : "badge-editor"
                  }`}
                  style={{ fontSize: "0.7rem", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <Shield size={12} /> {userWithExtras.role}
                </span>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit((data) => mutation.mutate(data))}
            style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}
          >
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input className="form-input" {...register("name")} />
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Bio / Profile Description</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: "120px" }}
                placeholder="A short description about yourself..."
                {...register("bio")}
              />
              {errors.bio && <span className="form-error">{errors.bio.message}</span>}
            </div>

            <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={mutation.isPending}
                style={{ padding: "12px 32px" }}
              >
                {mutation.isPending ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
                Update Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

