"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Edit3, Menu as MenuIcon, X, ChevronDown, ChevronUp, Link as LinkIcon, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { menuSchema, menuItemSchema, type MenuFormData, type MenuItemFormData } from "@/lib/validations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function MenusPage() {
  const queryClient = useQueryClient();
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data: menus, isLoading } = useQuery({
    queryKey: ["menus"],
    queryFn: async () => {
      const res = await fetch("/api/menus");
      const data = await res.json();
      if (!selectedMenuId && data.length > 0) setSelectedMenuId(data[0].id);
      return data;
    },
  });

  const selectedMenu = menus?.find((m: any) => m.id === selectedMenuId);

  const { register: regMenu, handleSubmit: subMenu, reset: resMenu } = useForm<MenuFormData>({
    resolver: zodResolver(menuSchema)
  });

  const { register: regItem, handleSubmit: subItem, reset: resItem, setValue: valItem } = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema)
  });

  const menuMutation = useMutation({
    mutationFn: async (data: MenuFormData) => {
      const res = await fetch("/api/menus", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      setSelectedMenuId(data.id);
      setIsMenuModalOpen(false);
      resMenu();
      toast.success("Menu created");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create menu");
    }
  });

  const itemMutation = useMutation({
    mutationFn: async (data: MenuItemFormData) => {
      const url = editingItem ? `/api/menus/${selectedMenuId}/items/${editingItem.id}` : `/api/menus/${selectedMenuId}/items`;
      const method = editingItem ? "PUT" : "POST";
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
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      setIsItemModalOpen(false);
      setEditingItem(null);
      resItem();
      toast.success(editingItem ? "Item updated" : "Item added");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save item");
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await fetch(`/api/menus/${selectedMenuId}/items/${itemId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success("Item removed");
    },
  });

  const openItemModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      resItem({
        label: item.label,
        url: item.url,
        target: item.target as "_self" | "_blank",
        order: item.order,
        parentId: item.parentId,
      });
    } else {
      setEditingItem(null);
      resItem({ target: "_self", order: 0 });
    }
    setIsItemModalOpen(true);
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Navigation Menus</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Design your site navigation structure
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsMenuModalOpen(true)}>
          <Plus size={18} />
          New Menu
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px", alignItems: "start" }}>
        {/* Menus List */}
        <div className="card" style={{ padding: "12px" }}>
          <h3 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", padding: "12px", letterSpacing: "0.05em" }}>Manage Menus</h3>
          {isLoading ? (
            [1, 2].map(i => <div key={i} className="skeleton" style={{ height: "40px", marginBottom: "8px", borderRadius: "8px" }} />)
          ) : menus?.map((menu: any) => (
            <div 
              key={menu.id} 
              onClick={() => setSelectedMenuId(menu.id)}
              className={`nav-item ${selectedMenuId === menu.id ? "active" : ""}`}
              style={{ cursor: "pointer", margin: "2px 0", justifyContent: "space-between" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <MenuIcon size={16} />
                <span>{menu.name}</span>
              </div>
              <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>{menu.location}</span>
            </div>
          ))}
        </div>

        {/* Menu Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {selectedMenu ? (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Menu: {selectedMenu.name}</h2>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Location: <code style={{ color: "var(--accent-secondary)" }}>{selectedMenu.location}</code></p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => openItemModal()}>
                  <Plus size={16} />
                  Add Link
                </button>
              </div>

              {selectedMenu.items?.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {selectedMenu.items.map((item: any) => (
                    <div key={item.id} className="card" style={{ background: "var(--bg-tertiary)", padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <LinkIcon size={16} color="var(--text-muted)" />
                          <div>
                            <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{item.label}</p>
                            <a 
                              href={item.url.startsWith('http') ? item.url : `http://localhost:3000${item.url}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ fontSize: "0.75rem", color: "var(--accent-secondary)", textDecoration: "none" }}
                              title="Test Link"
                            >
                              {item.url}
                            </a>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button className="btn btn-ghost btn-icon" onClick={() => openItemModal(item)}><Edit3 size={14} /></button>
                          <button className="btn btn-ghost btn-icon" style={{ color: "var(--danger)" }} onClick={() => {
                            toast(`Remove link "${item.label}"?`, {
                              action: { label: "Delete", onClick: () => deleteItemMutation.mutate(item.id) },
                              cancel: { label: "Cancel", onClick: () => {} }
                            });
                          }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "48px", border: "2px dashed var(--border-secondary)", borderRadius: "12px" }}>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>This menu is empty</p>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: "12px" }} onClick={() => openItemModal()}>
                    Add your first link
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: "var(--text-muted)" }}>Select a menu to edit</p>
            </div>
          )}
        </div>
      </div>

      {/* New Menu Modal */}
      {isMenuModalOpen && (
        <div className="dialog-overlay" onClick={() => setIsMenuModalOpen(false)}>
          <div className="dialog-content" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h2 className="dialog-title">Create Menu</h2>
              <button className="btn-ghost" onClick={() => setIsMenuModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={subMenu(data => menuMutation.mutate(data))} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">Menu Name</label>
                <input className="form-input" placeholder="e.g. Primary Header" {...regMenu("name")} />
              </div>
              <div className="form-group">
                <label className="form-label">Location Identifier</label>
                <input className="form-input" placeholder="e.g. header_main" {...regMenu("location")} />
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px" }}>The programmatic ID used in your frontend templates.</p>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: "12px" }} disabled={menuMutation.isPending}>
                Create Menu
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="dialog-overlay" onClick={() => setIsItemModalOpen(false)}>
          <div className="dialog-content" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h2 className="dialog-title">{editingItem ? "Edit Link" : "Add Link"}</h2>
              <button className="btn-ghost" onClick={() => setIsItemModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={subItem(data => itemMutation.mutate(data))} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">Link Label</label>
                <input className="form-input" placeholder="e.g. Services" {...regItem("label")} />
              </div>
              <div className="form-group">
                <label className="form-label">URL / Path</label>
                <input className="form-input" placeholder="/services or https://..." {...regItem("url")} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Target</label>
                  <select className="form-select" {...regItem("target")}>
                    <option value="_self">Same Tab</option>
                    <option value="_blank">New Tab</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input type="number" className="form-input" {...regItem("order", { valueAsNumber: true })} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: "12px" }} disabled={itemMutation.isPending}>
                {itemMutation.isPending ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
                {editingItem ? "Save Link" : "Add to Menu"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
