import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env") });
import { prisma } from "../src/lib/prisma";
import { scryptSync, randomBytes } from 'crypto';

async function main() {
    const user = await prisma.user.findFirst({ where: { email: 'abrhambest9@gmail.com' } });
    if (!user) { console.log('user not found'); return; }

    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync('Editor1234!', salt, 64).toString('hex');
    const hashedPassword = `${salt}:${hash}`;

    await prisma.account.updateMany({
        where: { userId: user.id },
        data: { password: hashedPassword }
    });
    console.log('Password reset to Editor1234!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
