import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

        // 1. Manually verify the token
        const verification = await prisma.verification.findFirst({
            where: {
                identifier: email,
                value: token,
                expiresAt: { gt: new Date() },
            },
        });

        if (!verification) {
            return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
        }

        // 2. Update the password using Better Auth's setPassword API
        // This ensures the new password is hashed exactly as Better Auth expects
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await auth.api.setPassword({
            body: {
                userId: user.id,
                newPassword: password,
            },
        });

        // 3. Invalidate all sessions for security
        await prisma.session.deleteMany({ where: { userId: user.id } });

        // 4. Delete the used verification token
        await prisma.verification.delete({ where: { id: verification.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[reset-password]", error);
        return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
    }
}
