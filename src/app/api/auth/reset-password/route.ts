import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scryptSync, randomBytes } from "crypto";

// POST /api/auth/reset-password
export async function POST(req: NextRequest) {
    try {
        const { email, token, password } = await req.json();

        if (!email || !token || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        }

        // Find the verification record
        const verification = await prisma.verification.findFirst({
            where: {
                identifier: `reset:${email}`,
                value: token,
                expiresAt: { gt: new Date() },
            },
        });

        if (!verification) {
            return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
        }

        // Find the user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Hash the password using Better Auth's expected format
        // Better Auth uses scrypt internally; we replicate the hashing
        const salt = randomBytes(16).toString("hex");
        const hash = scryptSync(password, salt, 64).toString("hex");
        const hashedPassword = `${salt}:${hash}`;

        // Update the credential account's password
        const updated = await prisma.account.updateMany({
            where: { userId: user.id, providerId: "credential" },
            data: { password: hashedPassword },
        });

        if (updated.count === 0) {
            // Create if it doesn't exist
            await prisma.account.create({
                data: {
                    accountId: user.id,
                    providerId: "credential",
                    userId: user.id,
                    password: hashedPassword,
                },
            });
        }

        // Invalidate all sessions for security
        await prisma.session.deleteMany({ where: { userId: user.id } });

        // Delete the used verification token
        await prisma.verification.delete({ where: { id: verification.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[reset-password]", error);
        return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
    }
}
