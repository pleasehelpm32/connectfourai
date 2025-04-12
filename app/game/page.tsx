// app/(game)/page.tsx
"use client";

import React, { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import GameBoard from "@/components/game/GameBoard";
import GameInfo from "@/components/game/GameInfo";
import { createInitialBoard, makeMove } from "@/lib/gameLogic";
import type { Player, BoardState } from "@/lib/types";

import { handleMakeMove } from "@/app/actions/gameActions";
import {
  findOrCreateGame,
  checkGameStatus,
} from "@/app/actions/matchmakingActions";
import type { GameStatus } from "@prisma/client"; // Import Prisma enum type
import { getGameCounts } from "@/app/actions/countActions";
interface GamePageState {
  turn: Player | null;
  playerCount: number;
  queueCount: number;
  board: BoardState;
  gameId: string | null;
  winner: Player | "TIE" | null;
  gameStatus: GameStatus; // Use Prisma enum type
  myColor: Player | null; // Store the color assigned to this client
}

export default function GamePage() {
  const [isPending, startTransition] = useTransition();
  // Add transition state specifically for finding game
  const [isFindingGame, startFindingGameTransition] = useTransition();

  const [status, setStatus] = useState<GamePageState>({
    turn: null,
    playerCount: 0,
    queueCount: 0,
    board: createInitialBoard(),
    gameId: null,
    winner: null,
    gameStatus: "WAITING" as GameStatus, // Default to WAITING initially
    myColor: null, // Initialize player color as null
  });

  // In game/page.tsx, update the useEffect:
  useEffect(() => {
    // Function to fetch counts and update state
    const fetchCounts = async () => {
      try {
        // Get player counts
        const counts = await getGameCounts();

        // Update state with new counts
        setStatus((prev) => ({
          ...prev,
          playerCount: counts.playingCount,
          queueCount: counts.waitingCount,
        }));

        // If we have a gameId, check for game updates (both for waiting and active games)
        if (status.gameId) {
          const gameStatus = await checkGameStatus(status.gameId);

          if (gameStatus.success) {
            // Check if there are any meaningful updates
            const boardChanged =
              gameStatus.board &&
              JSON.stringify(gameStatus.board) !== JSON.stringify(status.board);
            const statusChanged = gameStatus.status !== status.gameStatus;
            const turnChanged = gameStatus.turn !== status.turn;
            const winnerChanged = gameStatus.winner !== status.winner;

            // Update state if anything has changed
            if (boardChanged || statusChanged || turnChanged || winnerChanged) {
              setStatus((prev) => ({
                ...prev,
                gameStatus: gameStatus.status as GameStatus,
                turn: gameStatus.turn || null,
                winner: gameStatus.winner || null,
                board: gameStatus.board || prev.board,
              }));

              // Show toast messages for key state changes
              if (
                gameStatus.status === "ACTIVE" &&
                status.gameStatus !== "ACTIVE"
              ) {
                toast.success("Game started! Opponent has joined.");
              }

              if (
                gameStatus.status === "COMPLETED" &&
                status.gameStatus !== "COMPLETED"
              ) {
                if (gameStatus.winner === "TIE") {
                  toast.success("Game Over: It's a TIE!");
                } else if (gameStatus.winner) {
                  toast.success(`Game Over: ${gameStatus.winner} Wins!`);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    // Fetch counts immediately on component mount
    fetchCounts();

    // Set up interval to poll more frequently (every 2 seconds)
    const intervalId = setInterval(fetchCounts, 2000);

    // Cleanup function to clear interval when component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, [
    status.gameId,
    status.gameStatus,
    status.turn,
    status.winner,
    status.board,
  ]);

  // Function to find/create game using server action
  const handleFindGame = () => {
    startFindingGameTransition(async () => {
      console.log("Attempting to find or create game...");
      try {
        const result = await findOrCreateGame();

        if (
          result.success &&
          result.gameId &&
          result.playerColor &&
          result.board
        ) {
          setStatus((prev) => ({
            ...prev,
            gameId: result.gameId || null,
            myColor: result.playerColor || null,
            board: result.board || createInitialBoard(),
            turn: result.turn || null,
            gameStatus: result.status as GameStatus,
            winner: null,
          }));
          toast.info(result.message);
        } else {
          console.error("Matchmaking failed:", result.message);
          toast.error(result.message || "Failed to find or create game.");
        }
      } catch (error) {
        console.error("Error in findOrCreateGame:", error);
        toast.error("An unexpected error occurred while finding a game.");
      }
    });
  };

  // Function to handle column clicks
  const handleColumnClick = (columnIndex: number) => {
    // Prevent moves if not active, not player's turn, action pending, or color not assigned
    if (
      status.gameStatus !== "ACTIVE" ||
      !status.turn ||
      !status.gameId ||
      isPending ||
      status.turn !== status.myColor
    ) {
      if (status.turn && status.myColor && status.turn !== status.myColor) {
        toast.warning("Not your turn!");
      }
      console.log("Move prevented:", {
        status: status.gameStatus,
        turn: status.turn,
        myColor: status.myColor,
        gameId: status.gameId,
        isPending,
      });
      return;
    }

    const currentPlayer = status.turn;
    const currentBoard = status.board;

    startTransition(async () => {
      try {
        const result = await handleMakeMove(status.gameId, columnIndex);

        if (result.success && result.newState) {
          const nextBoard = makeMove(currentBoard, columnIndex, currentPlayer);

          setStatus((prev) => ({
            ...prev,
            board: nextBoard,
            turn: result.newState!.turn,
            winner: result.newState!.winner,
            gameStatus: result.newState!.status as GameStatus,
          }));

          if (result.newState.winner) {
            if (result.newState.winner === "TIE") {
              toast.success("Game Over: It's a TIE!");
            } else {
              toast.success(`Game Over: ${result.newState.winner} Wins!`);
            }
          }
        } else {
          console.error("Server Action failed:", result.message);
          toast.error(result.message || "Failed to make move.");
        }
      } catch (error) {
        console.error("Error calling server action:", error);
        toast.error("An unexpected error occurred while making the move.");
      }
    });
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
            // Disable board clicks if game not active, not user's turn, or during actions
            disabled={
              status.gameStatus !== "ACTIVE" ||
              status.turn !== status.myColor ||
              isPending ||
              isFindingGame
            }
            onColumnClick={handleColumnClick}
          />
          {(isPending || isFindingGame) && (
            <p className="text-center mt-2 text-sm text-gray-500">
              {isFindingGame ? "Finding game..." : "Processing move..."}
            </p>
          )}
        </div>

        {/* Game Info & Controls Area */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <GameInfo
            turn={status.turn}
            playerCount={status.playerCount}
            queueCount={status.queueCount}
            onPlayClick={handleFindGame}
            winner={status.winner}
            gameStatus={status.gameStatus}
            gameId={status.gameId} // Pass gameId
            findingGame={isFindingGame} // Pass finding game state
            myColor={status.myColor}
          />
        </div>
      </div>

      <footer className="mt-8 text-xs text-gray-500">
        Connect 4 Game - Phase I
      </footer>
    </main>
  );
}
