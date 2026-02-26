import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { categorySchema } from "@/lib/validations";
import { headers } from "next/headers";

export async function GET() {
    try {
        let categories = await prisma.category.findMany({
            include: { _count: { select: { posts: true } } },
            orderBy: { name: "asc" },
        });

        // Auto-seed a few sensible defaults if none exist yet
        if (!categories.length) {
            const defaults = [
                { name: "News", slug: "news", description: "Company and product announcements" },
                { name: "Blog", slug: "blog", description: "Long-form articles and stories" },
                { name: "Tutorials", slug: "tutorials", description: "Guides and how-to content" },
            ];

            categories = await prisma.$transaction(
                defaults.map((data) =>
                    prisma.category.create({
                        data,
                        include: { _count: { select: { posts: true } } },
                    }),
                ),
            );
        }

        return NextResponse.json(categories);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const data = categorySchema.parse(body);

        const category = await prisma.category.create({ data });
        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}
