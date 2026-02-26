import { z } from "zod";

// ─── Auth Schemas ─────────────────────────────────────────────────────────────
export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

// ─── Post Schemas ─────────────────────────────────────────────────────────────
export const postSchema = z.object({
    title: z.string().min(1, "Title is required").max(255),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
    excerpt: z.string().max(500).optional().or(z.literal("")),
    content: z.string().min(1, "Content is required"),
    coverImage: z.string().optional().or(z.literal("")),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    categoryId: z.string().optional().or(z.literal("")),
    tags: z.array(z.string()).optional(),
});

export type PostFormData = z.infer<typeof postSchema>;

// ─── Page Schemas ─────────────────────────────────────────────────────────────
export const pageSchema = z.object({
    title: z.string().min(1, "Title is required").max(255),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
    content: z.string().min(1, "Content is required"),
    metaTitle: z.string().max(60).optional().or(z.literal("")),
    metaDesc: z.string().max(160).optional().or(z.literal("")),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export type PageFormData = z.infer<typeof pageSchema>;

// ─── Banner Schemas ───────────────────────────────────────────────────────────
export const bannerSchema = z.object({
    title: z.string().min(1, "Title is required").max(255),
    subtitle: z.string().max(500).optional().or(z.literal("")),
    imageUrl: z.string().min(1, "Image URL is required"),
    linkUrl: z.string().optional().or(z.literal("")),
    linkText: z.string().max(50).optional().or(z.literal("")),
    position: z.string().min(1),
    isActive: z.boolean(),
    order: z.number().int().min(0),
});

export type BannerFormData = z.infer<typeof bannerSchema>;

// ─── Menu Schemas ─────────────────────────────────────────────────────────────
export const menuSchema = z.object({
    name: z.string().min(1, "Name is required"),
    location: z.string().min(1, "Location is required"),
});

export const menuItemSchema = z.object({
    label: z.string().min(1, "Label is required"),
    url: z.string().min(1, "URL is required"),
    target: z.enum(["_self", "_blank"]),
    order: z.number().int().min(0),
    parentId: z.string().optional().nullable(),
});

export type MenuFormData = z.infer<typeof menuSchema>;
export type MenuItemFormData = z.infer<typeof menuItemSchema>;

// ─── Category Schemas ─────────────────────────────────────────────────────────
export const categorySchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

// ─── User Schemas ─────────────────────────────────────────────────────────────
export const userUpdateSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    role: z.enum(["ADMIN", "EDITOR"]).optional(),
    bio: z.string().max(500).optional(),
    // Allow relative paths from the media API (e.g. /uploads/...)
    image: z
        .string()
        .min(1, "Avatar must be a valid image URL")
        .optional(),
});

export type UserUpdateData = z.infer<typeof userUpdateSchema>;

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
