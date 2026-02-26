import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { postSchema } from "@/lib/validations";
import { headers } from "next/headers";
import { broadcastNotification } from "@/lib/notifications";

// GET /api/posts/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, name: true, email: true, image: true } },
                category: true,
                tags: true,
            },
        });

        if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
        return NextResponse.json(post);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
    }
}

// PUT /api/posts/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        const data = postSchema.parse(body);

        const existing = await prisma.post.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

        // Only admin can edit others' posts
        if (existing.authorId !== session.user.id && (session.user as { role?: string }).role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: You can only edit your own posts" }, { status: 403 });
        }

        const post = await prisma.post.update({
            where: { id },
            data: {
                title: data.title,
                slug: data.slug,
                excerpt: data.excerpt,
                content: data.content,
                coverImage: data.coverImage || null,
                status: data.status,
                publishedAt:
                    data.status === "PUBLISHED" && !existing.publishedAt ? new Date() : existing.publishedAt,
                categoryId: data.categoryId || null,
                tags: {
                    set: [],
                    connectOrCreate: (data.tags || []).map((tag) => ({
                        where: { name: tag },
                        create: {
                            name: tag,
                            slug: tag.toLowerCase().replace(/\s+/g, "-"),
                        },
                    })),
                },
            },
            include: { author: true, category: true, tags: true },
        });

        await broadcastNotification({
            actorId: session.user.id,
            type: "POST_UPDATED",
            title: "Post Updated",
            message: `${session.user.name} updated the post: "${post.title}"`,
            link: `/dashboard/posts/${post.id}`,
        });

        return NextResponse.json(post);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
    }
}

// DELETE /api/posts/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const existing = await prisma.post.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

        if (existing.authorId !== session.user.id && (session.user as { role?: string }).role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: You can only delete your own posts" }, { status: 403 });
        }

        await prisma.post.delete({ where: { id } });

        await broadcastNotification({
            actorId: session.user.id,
            type: "POST_DELETED",
            title: "Post Deleted",
            message: `${session.user.name} deleted the post: "${existing.title}"`,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
    }
}
