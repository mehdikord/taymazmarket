import "dotenv/config";
import { prisma } from "../lib/prisma";
import { runSeed } from "./seed/run";

runSeed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
