const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://abrish:abrish@localhost:5432/cms_db?schema=public",
    },
  },
});

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
