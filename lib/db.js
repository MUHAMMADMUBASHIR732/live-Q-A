import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// Reuse one client in development so hot reloads do not open new connections.
export const db = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
