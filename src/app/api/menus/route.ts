import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { menuSchema } from "@/lib/validations";
import { headers } from "next/headers";

export async function GET() {
    try {
        const menus = await prisma.menu.findMany({
            include: {
                items: {
                    orderBy: { order: "asc" },
                    include: { children: { orderBy: { order: "asc" } } },
                    where: { parentId: null },
                },
            },
        });
        return NextResponse.json(menus);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch menus" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const data = menuSchema.parse(body);

        const menu = await prisma.menu.create({ data, include: { items: true } });
        return NextResponse.json(menu, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create menu" }, { status: 500 });
    }
}
