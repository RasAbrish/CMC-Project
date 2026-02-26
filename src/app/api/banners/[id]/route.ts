import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { bannerSchema } from "@/lib/validations";
import { headers } from "next/headers";

async function requireAuth() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return null;
    return session;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const banner = await prisma.banner.findUnique({ where: { id } });
        if (!banner) return NextResponse.json({ error: "Banner not found" }, { status: 404 });
        return NextResponse.json(banner);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch banner" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireAuth();
        if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { id } = await params;
        const body = await req.json();
        const data = bannerSchema.parse(body);

        const banner = await prisma.banner.update({ where: { id }, data });
        return NextResponse.json(banner);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update banner" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireAuth();
        if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { id } = await params;
        await prisma.banner.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 });
    }
}
