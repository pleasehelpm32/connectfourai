// app/actions/countActions.ts
"use server";

import { db } from "@/lib/db";

interface GameCounts {
  playingCount: number;
  waitingCount: number;
}

export async function getGameCounts(): Promise<GameCounts> {
  try {
    const activeGames = await db.game.count({
      where: { status: "ACTIVE" },
    });
    const waitingGames = await db.game.count({
      where: { status: "WAITING" },
    });

    // Each active game has 2 players, each waiting game has 1 player in queue
    return {
      playingCount: activeGames * 2,
      waitingCount: waitingGames,
    };
  } catch (error) {
    console.error("Error fetching game counts:", error);
    // Return 0 counts on error to prevent breaking UI
    return { playingCount: 0, waitingCount: 0 };
  }
}
