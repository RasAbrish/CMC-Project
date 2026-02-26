import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { postSchema } from "@/lib/validations";
import { headers } from "next/headers";
import { broadcastNotification } from "@/lib/notifications";

// GET /api/posts
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const status = searchParams.get("status");
        const search = searchParams.get("search");

        const where: Record<string, unknown> = {};
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { excerpt: { contains: search, mode: "insensitive" } },
            ];
        }

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                include: {
                    author: { select: { id: true, name: true, email: true } },
                    category: true,
                    tags: true,
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.post.count({ where }),
        ]);

        return NextResponse.json({ posts, total, page, limit });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }
}

// POST /api/posts
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const data = postSchema.parse(body);

        const post = await prisma.post.create({
            data: {
                title: data.title,
                slug: data.slug,
                excerpt: data.excerpt,
                content: data.content,
                coverImage: data.coverImage || null,
                status: data.status,
                publishedAt: data.status === "PUBLISHED" ? new Date() : null,
                authorId: session.user.id,
                categoryId: data.categoryId || null,
                tags: data.tags?.length
                    ? {
                        connectOrCreate: data.tags.map((tag) => ({
                            where: { name: tag },
                            create: {
                                name: tag,
                                slug: tag.toLowerCase().replace(/\s+/g, "-"),
                            },
                        })),
                    }
                    : undefined,
            },
            include: { author: true, category: true, tags: true },
        });

        // Notify others
        await broadcastNotification({
            actorId: session.user.id,
            type: "POST_CREATED",
            title: "New Post Published",
            message: `${session.user.name} created a new post: "${post.title}"`,
            link: `/dashboard/posts/${post.id}`,
        });

        return NextResponse.json(post, { status: 201 });
    } catch (error: unknown) {
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
        }
        console.error(error);
        return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }
}
