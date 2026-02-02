/**
 * Database client initialization and management.
 *
 * This module provides the Prisma database client for server-side database
 * operations. It implements a singleton pattern with lazy initialization and
 * graceful error handling. The client uses PostgreSQL via Prisma's PostgreSQL
 * adapter and supports connection pooling for efficient database access.
 *
 * The implementation ensures that:
 * - Only one Prisma client instance exists per process (singleton)
 * - Client initialization is deferred until first use (lazy loading)
 * - Initialization errors are cached and re-thrown consistently
 * - Development mode reuses the client across hot reloads
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

/**
 * Global object structure for storing Prisma client instance across hot reloads.
 *
 * In development mode, Next.js hot reloads can cause module re-execution.
 * Storing the Prisma client in globalThis prevents creating multiple database
 * connections during development. The prismaInitError is also stored to
 * ensure initialization errors persist across reloads.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaInitError: Error | undefined;
};

/**
 * Creates a new Prisma client instance with PostgreSQL adapter.
 *
 * Initializes a PrismaClient configured to use PostgreSQL via the PrismaPg
 * adapter. The adapter uses a connection pool for efficient database access.
 * Logging is configured based on the environment (more verbose in development).
 *
 * This function is called internally during lazy initialization. It should
 * not be called directly - use the exported `prisma` proxy or `getDb()` instead.
 *
 * @returns A configured PrismaClient instance ready for database operations.
 * @throws {Error} Throws an error if DATABASE_URL environment variable is not
 *   set or if Prisma client creation fails.
 *
 * @remarks
 * The function creates a PostgreSQL connection pool and configures Prisma
 * to use it. In development, logs errors and warnings; in production, only
 * logs errors to reduce noise.
 */
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/**
 * Module-level variables for lazy initialization.
 *
 * These variables cache the Prisma client instance and any initialization
 * errors. They are used to implement singleton behavior and error caching.
 */
let _prisma: PrismaClient | null = null;
let _initError: Error | null = null;

/**
 * Gets or creates the Prisma client instance (singleton pattern).
 *
 * Implements lazy initialization of the Prisma client. On first call, creates
 * the client and caches it. Subsequent calls return the cached instance. If
 * initialization fails, the error is cached and re-thrown on subsequent calls.
 *
 * The function checks multiple sources in order:
 * 1. Cached initialization error (re-throw if present)
 * 2. Cached client instance (return if present)
 * 3. Global client instance from previous hot reload (development)
 * 4. Global initialization error from previous hot reload (development)
 * 5. Create new client instance
 *
 * In non-production environments, the client is stored in globalThis to survive
 * hot reloads. In production, a new client is created each time (though the
 * module cache ensures this only happens once per process).
 *
 * @returns The Prisma client instance.
 * @throws {Error} Re-throws any error that occurred during client creation.
 *   The error is cached and will be thrown on all subsequent calls.
 */
function getPrismaClient(): PrismaClient {
  if (_initError) {
    throw _initError;
  }
  if (_prisma) {
    return _prisma;
  }
  if (globalForPrisma.prisma) {
    _prisma = globalForPrisma.prisma;
    return _prisma;
  }
  if (globalForPrisma.prismaInitError) {
    _initError = globalForPrisma.prismaInitError;
    throw _initError;
  }

  try {
    _prisma = createPrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = _prisma;
    }
    return _prisma;
  } catch (error) {
    _initError = error instanceof Error ? error : new Error(String(error));
    globalForPrisma.prismaInitError = _initError;
    throw _initError;
  }
}

/**
 * Exported Prisma client proxy for database operations.
 *
 * A Proxy object that lazily initializes the Prisma client on first property
 * access. This allows importing and using `prisma` without immediately
 * connecting to the database. The connection is established only when the
 * client is actually used (e.g., `prisma.presentation.findMany()`).
 *
 * The proxy intercepts all property access and ensures the underlying client
 * is initialized before forwarding the access. Function properties are bound
 * to the client instance to maintain correct `this` context.
 *
 * This is the primary way to access the database throughout the application.
 * Import this object and use it like a normal PrismaClient instance.
 *
 * @example
 * ```typescript
 * import { prisma } from "@/server/db";
 *
 * // Client is initialized on first use
 * const presentations = await prisma.presentation.findMany();
 * ```
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrismaClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

/**
 * Alias function for getting the database client.
 *
 * Provides an alternative way to access the Prisma client. This function
 * directly returns the client instance rather than using the proxy. Useful
 * for code that needs the actual client instance or for compatibility with
 * existing code patterns.
 *
 * @returns The Prisma client instance (same as accessing `prisma` directly).
 *
 * @example
 * ```typescript
 * import { getDb } from "@/server/db";
 *
 * const db = getDb();
 * const presentations = await db.presentation.findMany();
 * ```
 */
export const getDb = () => getPrismaClient();

/**
 * Type alias for the database client.
 *
 * Exported for use in type annotations throughout the application. This
 * ensures consistent typing when passing the database client as a parameter
 * or storing it in variables.
 */
export type DbClient = PrismaClient;
