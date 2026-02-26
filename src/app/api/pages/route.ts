import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { pageSchema } from "@/lib/validations";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search");

        const where: Record<string, unknown> = {};
        if (status) where.status = status;
        if (search) where.title = { contains: search, mode: "insensitive" };

        const pages = await prisma.page.findMany({
            where,
            include: { author: { select: { id: true, name: true } } },
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json(pages);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const data = pageSchema.parse(body);

        const page = await prisma.page.create({
            data: {
                ...data,
                publishedAt: data.status === "PUBLISHED" ? new Date() : null,
                authorId: session.user.id,
            },
            include: { author: true },
        });

        return NextResponse.json(page, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
    }
}
