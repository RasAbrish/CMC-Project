
import { auth } from "./src/lib/auth";
import { prisma } from "./src/lib/prisma";

async function test() {
    const user = await prisma.user.findFirst();
    if (!user) return console.log("No user found");

    console.log("Creating password reset request for:", user.email);

    // This will try to send an email, but we just want to see the DB record
    try {
        await auth.api.requestPasswordReset({
            body: {
                email: user.email,
                redirectTo: "http://localhost:3000/reset-password"
            }
        });
    } catch (e) {
        // It might fail if email service isn't configured, that's fine
        console.log("Request failed (as expected if no email service):", e.message);
    }

    const verifications = await prisma.verification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 1
    });
    console.log("CREATED_VERIFICATION:", JSON.stringify(verifications, null, 2));
}

test().finally(() => prisma.$disconnect());
