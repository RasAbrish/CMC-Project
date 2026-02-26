
import { prisma } from "./src/lib/prisma";

async function main() {
    const verifications = await prisma.verification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log("RECENT_VERIFICATIONS:", JSON.stringify(verifications, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
