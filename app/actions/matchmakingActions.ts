// In actions/matchmakingActions.ts
"use server";

import { db } from "@/lib/db";

export async function createTestGame() {
  // Create a unique ID for testing
  const gameId = `game_${Date.now()}`;
  const testPlayerId = `player_${Date.now()}`;

  // Create the game in the database
  const game = await db.game.create({
    data: {
      id: gameId,
      status: "ACTIVE",
      player1Id: testPlayerId,
      player2Id: testPlayerId, // Using same player for both slots for testing
    },
  });

  return game;
}
