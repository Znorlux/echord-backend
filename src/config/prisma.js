const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

// Manejar la desconexión al cerrar la aplicación
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
