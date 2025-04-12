// app/actions/matchmakingActions.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { Player, BoardState } from "@/lib/types";
import { createInitialBoard } from "@/lib/gameLogic";
import type { GameStatus } from "@prisma/client"; // Import enum generated by Prisma
import { makeMove } from "@/lib/gameLogic";
import { getGameCounts } from "@/app/actions/countActions";

// Define a return type for the action
interface MatchmakingResult {
  success: boolean;
  message: string;
  gameId?: string;
  playerColor?: Player; // Which color the requesting player will be
  board?: BoardState; // Initial board state
  turn?: Player | null; // Whose turn is it initially?
  status?: GameStatus; // The status of the game found/created
}

// Placeholder for generating player IDs if not using auth
// In a real app, this would come from an authentication system
let playerCounter = 0;
const generatePlayerId = () => `player_${Date.now()}_${playerCounter++}`;

export async function findOrCreateGame(): Promise<MatchmakingResult> {
  const newPlayerId = generatePlayerId(); // Generate an ID for the player requesting a game

  try {
    console.log("Attempting database connection for matchmaking");

    // Test database connection first
    const testConnection = await db.$queryRaw`SELECT 1 as test`;
    console.log("Database connection successful:", testConnection);
    // Use a transaction to prevent race conditions
    const result = await db.$transaction(async (tx) => {
      // 1. Look for a game waiting for player 2
      const waitingGame = await tx.game.findFirst({
        where: {
          status: "WAITING",
          player2Id: null, // Explicitly look for games needing player 2
        },
        orderBy: {
          createdAt: "asc", // Find the oldest waiting game
        },
      });

      // 2. If a waiting game is found, join it
      if (waitingGame) {
        const updatedGame = await tx.game.update({
          where: { id: waitingGame.id },
          data: {
            player2Id: newPlayerId, // Assign the new player as Player 2
            status: "ACTIVE", // Set the game to active
          },
        });

        console.log(
          `Player ${newPlayerId} joined game ${updatedGame.id} as BLUE`
        );
        return {
          success: true,
          message: "You've been matched! You are BLUE. Red starts.",
          gameId: updatedGame.id,
          playerColor: "BLUE" as Player,
          board: createInitialBoard(), // Start with a fresh board
          turn: "RED" as Player, // Red always starts
          status: updatedGame.status,
        };
      }
      // 3. If no waiting game, create a new one
      else {
        const newGame = await tx.game.create({
          data: {
            player1Id: newPlayerId, // The new player is Player 1 (Red)
            status: "WAITING", // Set status to waiting
            // player2Id remains null
          },
        });
        console.log(
          `Player ${newPlayerId} created game ${newGame.id} as RED, waiting.`
        );
        return {
          success: true,
          message: "Created new game. You are RED. Waiting for opponent...",
          gameId: newGame.id,
          playerColor: "RED" as Player,
          board: createInitialBoard(),
          turn: null, // No turns until game is active
          status: newGame.status,
        };
      }
    }); // End of transaction

    return result as MatchmakingResult; // Cast result
  } catch (error) {
    console.error("Detailed error in findOrCreateGame:", error);
    console.error("Error in findOrCreateGame:", error);
    let errorMessage =
      "Failed to find or create game due to an unexpected error.";
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      errorMessage = `Database error (${error.code}) prevented finding/creating game.`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, message: errorMessage };
  }
}

// In matchmakingActions.ts, let's enhance the checkGameStatus function to include the board state

export async function checkGameStatus(gameId: string | null): Promise<{
  success: boolean;
  message: string;
  status?: GameStatus;
  turn?: Player | null;
  winner?: Player | "TIE" | null;
  board?: BoardState;
}> {
  if (!gameId) {
    return { success: false, message: "No game ID provided" };
  }

  try {
    const game = await db.game.findUnique({
      where: { id: gameId },
      include: {
        moves: {
          orderBy: {
            moveOrder: "asc",
          },
        },
      },
    });

    if (!game) {
      return { success: false, message: "Game not found" };
    }

    // Determine current turn based on moves count
    const currentTurn =
      game.status === "ACTIVE"
        ? ((game.moves.length % 2 === 0 ? "RED" : "BLUE") as Player)
        : null;

    // Reconstruct the board state from moves
    let boardState = createInitialBoard();
    for (const move of game.moves) {
      boardState = makeMove(boardState, move.column, move.player as Player);
    }

    return {
      success: true,
      message: "Game status retrieved",
      status: game.status,
      turn: currentTurn,
      winner: (game.winner as Player | null) || (game.isTie ? "TIE" : null),
      board: boardState,
    };
  } catch (error) {
    console.error("Error checking game status:", error);
    return { success: false, message: "Failed to check game status" };
  }
}
