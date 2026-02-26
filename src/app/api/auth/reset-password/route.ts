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

        try {
            await auth.api.resetPassword({
                body: {
                    newPassword: password,
                    token: token,
                },
            });
        } catch (authError: any) {
            console.error("[reset-password] Auth API error:", authError);
            return NextResponse.json(
                { error: "Invalid or expired reset link" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            await prisma.session.deleteMany({ where: { userId: user.id } });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[reset-password]", error);
        return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
    }
}
