import { hashPassword } from "better-auth/crypto";
import { prisma } from "../src/lib/prisma";

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@admin.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";

    console.log(`Checking if default admin (${adminEmail}) exists...`);

    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (!existingAdmin) {
        const hashedPassword = await hashPassword(adminPassword);

        await prisma.user.create({
            data: {
                email: adminEmail,
                name: "Admin",
                role: "ADMIN",
                emailVerified: true,
                accounts: {
                    create: {
                        providerId: "credential",
                        accountId: adminEmail,
                        password: hashedPassword,
                    }
                }
            },
        });

        console.log(` Default admin created successfully!`);
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
    } else {
        console.log(`Admin account already exists.`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
