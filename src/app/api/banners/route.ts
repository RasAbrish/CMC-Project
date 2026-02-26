import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { bannerSchema } from "@/lib/validations";
import { headers } from "next/headers";

export async function GET() {
    try {
        const banners = await prisma.banner.findMany({ orderBy: { order: "asc" } });
        return NextResponse.json(banners);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const data = bannerSchema.parse(body);

        const banner = await prisma.banner.create({ data });
        return NextResponse.json(banner, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
    }
}
