// app/actions/gameActions.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
"use server"; // Mark this module as containing Server Actions

import { Prisma } from "@prisma/client";
import { Player as PrismaPlayer } from "@prisma/client";

import { db } from "@/lib/db"; // Your Prisma client instance
import {
  createInitialBoard,
  isValidMove,
  makeMove, // We'll use this to reconstruct the board
  checkWin,
  checkTie,
  COLS,
} from "@/lib/gameLogic";
import type { Player, BoardState } from "@/lib/types";

// Define a return type for the action
interface ActionResult {
  success: boolean;
  message?: string; // Optional error or success message
  newState?: {
    // Optionally return key state changes if needed
    board?: BoardState; // Might be heavy, consider reconstructing client-side
    turn: Player | null;
    winner: Player | "TIE" | null;
    status: "ACTIVE" | "COMPLETED" | "WAITING"; // Reflecting GameStatus enum
  };
}

export async function handleMakeMove(
  gameId: string | null,
  column: number
): Promise<ActionResult> {
  if (!gameId) {
    return { success: false, message: "Game ID is missing." };
  }
  if (column < 0 || column >= COLS) {
    return { success: false, message: "Invalid column index." };
  }

  try {
    // 1. Fetch Game and its Moves
    const game = await db.game.findUnique({
      where: { id: gameId },
      include: {
        moves: {
          orderBy: {
            moveOrder: "asc", // Ensure moves are in the correct sequence
          },
        },
      },
    });

    if (!game) {
      return { success: false, message: "Game not found." };
    }
    if (game.status !== "ACTIVE") {
      return { success: false, message: "Game is not active." };
    }
    if (!game.player1Id || !game.player2Id) {
      return { success: false, message: "Game is missing players." }; // Should not happen if active, but check
    }

    // 2. Determine Current Player and Reconstruct Board
    const moves = game.moves;
    const currentPlayerTurnIndex = moves.length % 2; // 0 for Red (player1), 1 for Blue (player2)
    const currentPlayerColor: Player =
      currentPlayerTurnIndex === 0 ? "RED" : "BLUE";
    const currentPlayerId =
      currentPlayerTurnIndex === 0 ? game.player1Id : game.player2Id;

    let currentBoard = createInitialBoard();
    for (const move of moves) {
      // Ensure move.player is correctly typed as Player if necessary
      currentBoard = makeMove(currentBoard, move.column, move.player as Player);
    }

    // 3. Validate Move
    if (!isValidMove(currentBoard, column)) {
      return {
        success: false,
        message: "Invalid move: Column might be full or out of bounds.",
      };
    }

    // 4. Create the New Move in DB
    const newMoveOrder = moves.length; // Moves are 0-indexed in array, order is 0, 1, 2...
    await db.move.create({
      data: {
        gameId: game.id,
        playerId: currentPlayerId,
        player: currentPlayerColor as unknown as PrismaPlayer,
        column: column,
        moveOrder: newMoveOrder,
      },
    });

    // 5. Reconstruct Next Board State and Check for Win/Tie
    const nextBoard = makeMove(currentBoard, column, currentPlayerColor);
    const winner = checkWin(nextBoard, currentPlayerColor);
    const tie = !winner && checkTie(nextBoard);

    let finalStatus: "WAITING" | "ACTIVE" | "COMPLETED" | "ABANDONED" =
      game.status;
    let finalWinner: Player | "TIE" | null = null;

    // 6. Update Game Status if Win or Tie
    if (winner) {
      finalStatus = "COMPLETED";
      finalWinner = currentPlayerColor;
      await db.game.update({
        where: { id: gameId },
        data: {
          status: "COMPLETED",
          winner: currentPlayerColor as unknown as PrismaPlayer,
        },
      });
      console.log(`Game ${gameId} completed. Winner: ${currentPlayerColor}`);
    } else if (tie) {
      finalStatus = "COMPLETED";
      finalWinner = "TIE";
      await db.game.update({
        where: { id: gameId },
        data: {
          status: "COMPLETED",
          isTie: true,
        },
      });
      console.log(`Game ${gameId} completed. Result: TIE`);
    }

    // 8. Return Success
    const nextTurn =
      winner || tie ? null : currentPlayerColor === "RED" ? "BLUE" : "RED";
    return {
      success: true,
      message: `Move by ${currentPlayerColor} successful.`,
      newState: {
        // Avoid sending the full board, let client reconstruct if needed
        turn: nextTurn,
        winner: finalWinner,
        status: finalStatus,
      },
    };
  } catch (error) {
    console.error("Error in handleMakeMove:", error);
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors if necessary
      errorMessage = `Database error: ${error.code}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, message: errorMessage };
  }
}
