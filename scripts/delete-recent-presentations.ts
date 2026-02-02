/**
 * Script to delete the 6 most recently created presentations from the database.
 *
 * Utility script for database maintenance. Connects to the database using
 * Prisma with PostgreSQL adapter, retrieves the 6 most recent presentations,
 * displays them for confirmation, and deletes them. Useful for cleaning up
 * test data or managing database size during development.
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

/**
 * Database connection string from environment variables.
 * Required for connecting to the PostgreSQL database.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

/**
 * PostgreSQL connection pool.
 * Manages database connections efficiently.
 */
const pool = new pg.Pool({ connectionString });

/**
 * Prisma PostgreSQL adapter.
 * Enables Prisma to work with the PostgreSQL connection pool.
 */
const adapter = new PrismaPg(pool);

/**
 * Prisma client instance.
 * Provides type-safe database access.
 */
const prisma = new PrismaClient({ adapter });

/**
 * Main function to delete recent presentations.
 *
 * Retrieves the 6 most recently created presentations, displays their
 * information for confirmation, and deletes them from the database.
 * Handles errors gracefully and ensures database connections are closed.
 *
 * @throws Exits process with code 1 if an error occurs during deletion.
 */
const main = async () => {
  try {
    // Retrieve the 6 most recently created presentations
    const recentPresentations = await prisma.presentation.findMany({
      orderBy: {
        created_at: "desc",
      },
      take: 6,
      select: {
        id: true,
        title: true,
        created_at: true,
      },
    });

    if (recentPresentations.length === 0) {
      console.log("No presentations to delete.");
      return;
    }

    console.log(`\nPresentations to delete (${recentPresentations.length}):`);
    recentPresentations.forEach((p, index) => {
      console.log(
        `${index + 1}. ID: ${p.id}, Title: ${p.title || "(No title)"}, Created at: ${p.created_at.toISOString()}`,
      );
    });

    // Execute deletion
    const ids = recentPresentations.map((p) => p.id);
    const deleteResult = await prisma.presentation.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    console.log(
      `\n✅ Successfully deleted ${deleteResult.count} presentations.`,
    );
  } catch (error) {
    console.error("❌ Error during deletion:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
};

main();
