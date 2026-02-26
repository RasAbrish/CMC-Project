import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const file = await prisma.mediaFile.findUnique({ where: { id } });
        if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

        if (file.uploadedById !== session.user.id && (session.user as { role?: string }).role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Delete from Cloudinary
        try {
            const publicId = `cms_uploads/${file.name}`;
            const resourceType = file.type === "video" ? "video" : file.type === "image" ? "image" : "raw";
            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        } catch (err) {
            console.error("Cloudinary delete error:", err);
            // Continue to delete from DB even if Cloudinary fails
        }

        await prisma.mediaFile.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        const { alt } = body;

        const file = await prisma.mediaFile.update({
            where: { id },
            data: { alt },
        });

        return NextResponse.json(file);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update file" }, { status: 500 });
    }
}
