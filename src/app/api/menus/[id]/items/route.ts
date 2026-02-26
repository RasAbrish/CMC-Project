import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { menuItemSchema } from "@/lib/validations";
import { headers } from "next/headers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: menuId } = await params;
        const body = await req.json();
        const data = menuItemSchema.parse(body);

        const item = await prisma.menuItem.create({
            data: { ...data, menuId },
        });

        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: menuId } = await params;
        const body = await req.json();
        const { items } = body;

        // Batch update menu items order
        if (Array.isArray(items)) {
            await Promise.all(
                items.map((item: { id: string; order: number }) =>
                    prisma.menuItem.update({
                        where: { id: item.id },
                        data: { order: item.order },
                    })
                )
            );

            const menu = await prisma.menu.findUnique({
                where: { id: menuId },
                include: {
                    items: {
                        orderBy: { order: "asc" },
                        include: { children: { orderBy: { order: "asc" } } },
                        where: { parentId: null },
                    },
                },
            });

            return NextResponse.json(menu);
        }

        return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update menu items" }, { status: 500 });
    }
}
