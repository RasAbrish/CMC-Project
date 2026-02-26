import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env") });

import { prisma } from "../src/lib/prisma";

async function main() {
    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true },
    });
    console.log("Current users:", JSON.stringify(users, null, 2));

    if (users.length > 0) {
        const updated = await prisma.user.update({
            where: { id: users[0].id },
            data: { role: "ADMIN" },
            select: { id: true, name: true, email: true, role: true },
        });
        console.log("Updated first user to ADMIN:", JSON.stringify(updated, null, 2));
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
