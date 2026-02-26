import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";

const FROM_EMAIL = "abrhambest7@gmail.com";

function getTransporter() {
    // Use Gmail SMTP. For production configure SMTP_USER/SMTP_PASS in .env
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.SMTP_USER || FROM_EMAIL,
            pass: process.env.SMTP_PASS || "",
        },
    });
}

// POST /api/auth/forgot-password
export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json({ success: true });
        }

        // Create a reset token
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Better Auth expects the identifier to be the email for password reset verification
        await prisma.verification.create({
            data: {
                identifier: email,
                value: token,
                expiresAt,
            },
        });

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

        try {
            const transporter = getTransporter();
            await transporter.sendMail({
                from: `"CMS Admin" <${FROM_EMAIL}>`,
                to: email,
                subject: "Reset Your Password",
                html: `
                    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f0f13; color: #e2e2e8; border-radius: 16px;">
                        <div style="text-align: center; margin-bottom: 32px;">
                            <div style="width: 56px; height: 56px; border-radius: 14px; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                                <span style="color: white; font-size: 24px;">✦</span>
                            </div>
                            <h1 style="font-size: 1.5rem; font-weight: 800; margin: 0;">Reset Your Password</h1>
                        </div>
                        <p style="color: #8888a0; margin-bottom: 24px;">
                            We received a request to reset the password for your CMS account. Click the button below to set a new password:
                        </p>
                        <a href="${resetUrl}" style="display: block; text-align: center; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; margin-bottom: 24px;">
                            Reset Password
                        </a>
                        <p style="color: #8888a0; font-size: 0.85rem;">
                            This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
                        </p>
                        <hr style="border-color: #1e1e2e; margin: 24px 0;" />
                        <p style="color: #5555660; font-size: 0.75rem; text-align: center;">CMS Admin System</p>
                    </div>
                `,
            });
        } catch (mailError) {
            console.error("[forgot-password] email send failed:", mailError);
            // We still return success — the token was created in DB
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}
