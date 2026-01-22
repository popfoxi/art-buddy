import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Use POSTGRES_PRISMA_URL (pooled) for the application client
// This ensures we don't exhaust database connections in serverless environments
const prismaUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasourceUrl: prismaUrl
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
