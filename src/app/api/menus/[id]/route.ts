import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { menuSchema } from "@/lib/validations";
import { headers } from "next/headers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const menu = await prisma.menu.findUnique({
            where: { id },
            include: {
                items: {
                    orderBy: { order: "asc" },
                    include: { children: { orderBy: { order: "asc" } } },
                    where: { parentId: null },
                },
            },
        });
        if (!menu) return NextResponse.json({ error: "Menu not found" }, { status: 404 });
        return NextResponse.json(menu);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const data = menuSchema.parse(body);

        const menu = await prisma.menu.update({ where: { id }, data, include: { items: true } });
        return NextResponse.json(menu);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update menu" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await prisma.menu.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete menu" }, { status: 500 });
    }
}
