// lib/db.ts
import { PrismaClient } from "@prisma/client";

// Declare a global variable to hold the Prisma Client instance.
// We use 'var' to declare it on the global scope for development HMR.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Check if we are in production or if the client already exists on the global object.
// If not, create a new instance. Otherwise, reuse the existing instance.
export const db =
  globalThis.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// In development, assign the client instance to the global object.
// This ensures that the same instance is reused across hot reloads.
if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

// Note: The 'export const db' line both exports the client for use
// AND initializes it if it doesn't exist yet on globalThis.prisma.
