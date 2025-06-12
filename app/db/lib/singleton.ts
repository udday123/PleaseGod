// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Augment the globalThis object to include the 'prisma' property
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient();
};

// Use globalThis.prisma if it exists, otherwise create a new PrismaClient instance
const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

// In development, store the PrismaClient instance on globalThis to prevent
// multiple instances from being created during hot-reloading.
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
