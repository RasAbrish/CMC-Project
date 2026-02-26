import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const where: Record<string, unknown> = {};
        if (type) where.type = type;
        if (search) where.name = { contains: search, mode: "insensitive" };

        const [files, total] = await Promise.all([
            prisma.mediaFile.findMany({
                where,
                include: { uploadedBy: { select: { id: true, name: true } } },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.mediaFile.count({ where }),
        ]);

        return NextResponse.json({ files, total, page, limit });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch media files" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: "File size exceeds 50MB limit" }, { status: 400 });
        }

        const allowedTypes = [
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
            "video/mp4", "video/webm",
            "application/pdf",
            "text/plain",
        ];

        // Cloudinary technically supports more, but we still secure the endpoint
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadPromise = new Promise<{ secure_url: string, public_id: string, resource_type: string, format: string }>((resolve, reject) => {
            const resourceType = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : "raw";
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: resourceType,
                    folder: "cms_uploads",
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result as any);
                }
            );
            streamifier.createReadStream(buffer).pipe(uploadStream);
        });

        const result = await uploadPromise;

        const fileType = file.type.startsWith("image/") ? "image"
            : file.type.startsWith("video/") ? "video"
                : "file";

        const mediaFile = await prisma.mediaFile.create({
            data: {
                name: result.public_id.split('/').pop() || result.public_id,
                originalName: file.name,
                url: result.secure_url,
                type: fileType,
                size: file.size,
                mimeType: file.type,
                uploadedById: (session.user as any).id,
            },
        });

        return NextResponse.json(mediaFile, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }
}
