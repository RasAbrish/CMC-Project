import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const [posts, pages, media, users, recentPosts, recentPages] = await Promise.all([
            prisma.post.groupBy({ by: ["status"], _count: true }),
            prisma.page.count(),
            prisma.mediaFile.count(),
            prisma.user.count(),
            prisma.post.findMany({
                take: 5,
                orderBy: { createdAt: "desc" },
                include: { author: { select: { name: true } } },
            }),
            prisma.page.findMany({
                take: 5,
                orderBy: { updatedAt: "desc" },
                include: { author: { select: { name: true } } },
            }),
        ]);

        const postStats = {
            total: posts.reduce((sum: number, g: any) => sum + g._count, 0),
            published: posts.find((g: any) => g.status === "PUBLISHED")?._count || 0,
            draft: posts.find((g: any) => g.status === "DRAFT")?._count || 0,
        };

        // Simple activity timeline for the last 7 days (total new items per day)
        const since = new Date();
        since.setDate(since.getDate() - 6); // today + previous 6 days

        const [recentPostEvents, recentPageEvents, recentMediaEvents, recentUserEvents] = await Promise.all([
            prisma.post.findMany({
                where: { createdAt: { gte: since } },
                select: { createdAt: true },
            }),
            prisma.page.findMany({
                where: { createdAt: { gte: since } },
                select: { createdAt: true },
            }),
            prisma.mediaFile.findMany({
                where: { createdAt: { gte: since } },
                select: { createdAt: true },
            }),
            prisma.user.findMany({
                where: { createdAt: { gte: since } },
                select: { createdAt: true },
            }),
        ]);

        const byDay: Record<string, number> = {};
        const allEvents = [
            ...recentPostEvents,
            ...recentPageEvents,
            ...recentMediaEvents,
            ...recentUserEvents,
        ];

        allEvents.forEach((e) => {
            const d = new Date(e.createdAt);
            const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
            byDay[key] = (byDay[key] || 0) + 1;
        });

        const activityTimeline = Array.from({ length: 7 }).map((_, idx) => {
            const d = new Date(since);
            d.setDate(since.getDate() + idx);
            const key = d.toISOString().slice(0, 10);
            return {
                date: key,
                total: byDay[key] || 0,
            };
        });

        return NextResponse.json({
            posts: postStats,
            pages,
            media,
            users,
            recentPosts,
            recentPages,
            activityTimeline,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
