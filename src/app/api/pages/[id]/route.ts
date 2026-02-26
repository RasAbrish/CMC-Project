import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { pageSchema } from "@/lib/validations";
import { headers } from "next/headers";
import { broadcastNotification } from "@/lib/notifications";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const page = await prisma.page.findUnique({
            where: { id },
            include: { author: { select: { id: true, name: true, email: true } } },
        });
        if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });
        return NextResponse.json(page);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        const data = pageSchema.parse(body);

        const existing = await prisma.page.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: "Page not found" }, { status: 404 });

        // Only admin can edit others' pages
        if (existing.authorId !== session.user.id && (session.user as { role?: string }).role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: You can only edit your own pages" }, { status: 403 });
        }

        const page = await prisma.page.update({
            where: { id },
            data: {
                ...data,
                publishedAt: data.status === "PUBLISHED" && !existing.publishedAt ? new Date() : existing.publishedAt,
            },
            include: { author: true },
        });

        await broadcastNotification({
            actorId: session.user.id,
            type: "PAGE_UPDATED",
            title: "Page Updated",
            message: `${session.user.name} updated the page: "${page.title}"`,
            link: `/dashboard/pages/${page.id}`,
        });

        return NextResponse.json(page);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const existing = await prisma.page.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: "Page not found" }, { status: 404 });

        if (existing.authorId !== session.user.id && (session.user as { role?: string }).role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: You can only delete your own pages" }, { status: 403 });
        }

        await prisma.page.delete({ where: { id } });

        await broadcastNotification({
            actorId: session.user.id,
            type: "PAGE_UPDATED",
            title: "Page Deleted",
            message: `${session.user.name} deleted the page: "${existing.title}"`,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
    }
}
