// In actions/debugActions.ts
"use server";

import { db } from "@/lib/db";

export async function testDatabaseConnection() {
  try {
    // Try a simple database operation
    const count = await db.game.count();
    return {
      success: true,
      message: `Connected successfully. Found ${count} games.`,
    };
  } catch (error) {
    console.error("Database connection error:", error);
    return { success: false, message: String(error) };
  }
}
