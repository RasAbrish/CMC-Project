"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { useState } from "react";
import { 
  Users, 
  Shield, 
  User as UserIcon, 
  Trash2, 
  Edit3, 
  Mail, 
  Search, 
  CheckCircle,
  X,
  Save,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { userUpdateSchema, type UserUpdateData } from "@/lib/validations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [editingUser, setEditingUser] = useState<any>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Restricted Access");
      return res.json();
    },
  });

  const { register, handleSubmit, reset } = useForm<UserUpdateData>({
    resolver: zodResolver(userUpdateSchema)
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UserUpdateData) => {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
      toast.success("User updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/users/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User removed");
    },
  });

  const startEdit = (user: any) => {
    setEditingUser(user);
    reset({
      name: user.name,
      role: user.role,
      bio: user.bio || ""
    });
  };

  if (isLoading) return <div style={{ padding: "100px", textAlign: "center" }}><Loader2 size={40} className="spinner" /></div>;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Administrate team access levels and profiles
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Status</th>
              <th>Content Activity</th>
              <th>Joined</th>
              <th style={{ width: "100px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user: any) => (
              <tr key={user.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ 
                      width: "40px", 
                      height: "40px", 
                      borderRadius: "12px", 
                      background: "var(--accent-glow)", 
                      color: "var(--accent-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800
                    }}>
                      {user.image ? <img src={user.image} style={{ width: "100%", height: "100%", borderRadius: "12px" }} /> : user.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600 }}>{user.name} {user.id === session?.user.id && <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 400 }}>(You)</span>}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Mail size={12} /> {user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${user.role === "ADMIN" ? "badge-admin" : "badge-editor"}`} style={{ display: "inline-flex", gap: "4px" }}>
                    <Shield size={12} /> {user.role}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "12px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    <span title="Posts"><span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{user._count.posts}</span> posts</span>
                    <span title="Pages"><span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{user._count.pages}</span> pages</span>
                  </div>
                </td>
                <td style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                  {formatDate(user.createdAt)}
                </td>
                <td>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button className="btn btn-ghost btn-icon" onClick={() => startEdit(user)}><Edit3 size={15} /></button>
                    {user.id !== session?.user.id && (
                      <button className="btn btn-ghost btn-icon" style={{ color: "var(--danger)" }} onClick={() => {
                        toast(`Remove user ${user.name}?`, {
                          action: { label: "Delete", onClick: () => deleteMutation.mutate(user.id) },
                          cancel: { label: "Cancel", onClick: () => {} }
                        });
                      }}><Trash2 size={15} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="dialog-overlay" onClick={() => setEditingUser(null)}>
          <div className="dialog-content" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h2 className="dialog-title">Edit User Info</h2>
              <button className="btn-ghost" onClick={() => setEditingUser(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(data => updateMutation.mutate(data))} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" {...register("name")} />
              </div>
              <div className="form-group">
                <label className="form-label">Role Permissions</label>
                <select className="form-select" {...register("role")} disabled={editingUser.id === session?.user.id}>
                  <option value="ADMIN">Administrator</option>
                  <option value="EDITOR">Editor (Content Only)</option>
                </select>
                {editingUser.id === session?.user.id && <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px" }}>Cannot change your own role.</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Biography</label>
                <textarea className="form-textarea" placeholder="Short bio about this member..." {...register("bio")} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: "12px" }} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
                Update Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
