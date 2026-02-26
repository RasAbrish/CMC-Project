import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Notification } from "@prisma/client";

// GET /api/notifications — list notifications for current user
export async function GET() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: 30,
        });

        const unread = notifications.filter((n: Notification) => !n.read).length;

        return NextResponse.json({ notifications, unread });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }
}
