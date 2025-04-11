// app/(game)/page.tsx
"use client";

import React, { useState, useTransition } from "react"; // Import useTransition
import { toast } from "sonner"; // Import Sonner toast
import { createTestGame } from "@/app/actions/matchmakingActions";
import GameBoard from "@/components/game/GameBoard";
import GameInfo from "@/components/game/GameInfo";
// Import game logic and types
import {
  createInitialBoard,
  makeMove,
  checkWin,
  checkTie,
  ROWS,
  COLS,
} from "@/lib/gameLogic";
import type { Player, BoardState, SlotState } from "@/lib/types";
// Import the Server Action
import { handleMakeMove } from "@/app/actions/gameActions";

// (Keep Player type alias if needed)
// type Player = 'RED' | 'BLUE';

interface GamePageState {
  turn: Player | null;
  playerCount: number;
  queueCount: number;
  board: BoardState;
  gameId: string | null;
  winner: Player | "TIE" | null; // Add winner state
  gameStatus: "WAITING" | "ACTIVE" | "COMPLETED"; // Track game status
}

export default function GamePage() {
  const [isPending, startTransition] = useTransition(); // Hook for loading state
  const [status, setStatus] = useState<GamePageState>({
    turn: null,
    playerCount: 0,
    queueCount: 0,
    board: createInitialBoard(),
    gameId: null,
    winner: null, // Initialize winner
    gameStatus: "WAITING", // Initial status
  });

  // Find Game simulation (Keep as is for now, will integrate matchmaking later)
  const handleFindGame = async () => {
    console.log("Finding game...");
    try {
      const newGame = await createTestGame();
      setStatus((prev) => ({
        ...prev,
        turn: "RED",
        board: createInitialBoard(),
        gameId: newGame.id, // Use the real game ID from the database
        winner: null,
        gameStatus: "ACTIVE",
      }));
      toast.info("New game started. Red's turn!");
    } catch (error) {
      console.error("Error creating test game:", error);
      toast.error("Failed to create game");
    }
  };

  // Function to handle column clicks - NOW calls server action
  const handleColumnClick = (columnIndex: number) => {
    // Prevent moves if game is over, not active, or action is pending
    if (
      status.gameStatus !== "ACTIVE" ||
      !status.turn ||
      !status.gameId ||
      isPending
    ) {
      console.log("Move prevented:", {
        status: status.gameStatus,
        turn: status.turn,
        gameId: status.gameId,
        isPending,
      });
      return;
    }

    // Get current player before starting transition
    const currentPlayer = status.turn;
    const currentBoard = status.board; // Store current board for local update

    // Start transition for the server action call
    startTransition(async () => {
      try {
        // --- Call the Server Action ---
        const result = await handleMakeMove(status.gameId, columnIndex);
        // --- Handle the Result ---
        if (result.success && result.newState) {
          // Apply the move locally ONLY IF server confirmed success
          const nextBoard = makeMove(currentBoard, columnIndex, currentPlayer); // Use the same logic locally

          // Update state based on server's confirmed new state
          setStatus((prev) => ({
            ...prev,
            board: nextBoard, // Update board locally
            turn: result.newState!.turn,
            winner: result.newState!.winner,
            gameStatus: result.newState!.status,
          }));

          // Announce winner/tie with toast
          if (result.newState.winner) {
            if (result.newState.winner === "TIE") {
              toast.success("Game Over: It's a TIE!");
            } else {
              toast.success(`Game Over: ${result.newState.winner} Wins!`);
            }
          } else {
            // Optional: Toast for successful move
            // toast.success(`Move by ${currentPlayer} successful.`);
          }
        } else {
          // Show error toast if action failed
          console.error("Server Action failed:", result.message);
          toast.error(result.message || "Failed to make move.");
        }
      } catch (error) {
        console.error("Error calling server action:", error);
        toast.error("An unexpected error occurred while making the move.");
      }
    }); // End of startTransition
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 dark:text-gray-200">
        Connect 4
      </h1>

      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 md:gap-10">
        {/* Game Board Area */}
        <div className="flex-shrink-0">
          <GameBoard
            boardState={status.board}
            // Disable board clicks if game not active, or during server action
            disabled={status.gameStatus !== "ACTIVE" || isPending}
            onColumnClick={handleColumnClick}
          />
          {isPending && (
            <p className="text-center mt-2 text-sm text-gray-500">
              Processing move...
            </p>
          )}
        </div>

        {/* Game Info & Controls Area */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <GameInfo
            turn={status.turn}
            playerCount={status.playerCount} // Still placeholder counts
            queueCount={status.queueCount} // Still placeholder counts
            onPlayClick={handleFindGame}
            // Pass winner and status to GameInfo
            winner={status.winner}
            gameStatus={status.gameStatus}
          />
        </div>
      </div>

      <footer className="mt-8 text-xs text-gray-500">
        Connect 4 Game - Phase I
      </footer>
    </main>
  );
}
