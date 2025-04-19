// hooks/useGame.ts
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Player, BoardState } from "@/lib/types";
import type { GameStatus } from "@prisma/client";
import {
  createInitialBoard,
  makeMove,
  isValidMove,
  checkWin,
  checkTie,
  COLS,
} from "@/lib/gameLogic";

// Keep basic Supabase for data persistence if desired
import { supabase } from "@/lib/supabaseClient";

interface GameState {
  turn: Player | null;
  board: BoardState;
  gameId: string | null;
  winner: Player | "TIE" | null;
  gameStatus: GameStatus;
  myColor: Player; // Always RED for the human player
  playerCount: number; // Keep this for UI compatibility
  queueCount: number; // Keep this for UI compatibility
}

export function useGame(userId: string | null) {
  const [gameState, setGameState] = useState<GameState>({
    turn: "RED", // Game starts with RED (human player)
    board: createInitialBoard(),
    gameId: null,
    winner: null,
    gameStatus: "WAITING",
    myColor: "RED", // Human is always RED
    playerCount: 0,
    queueCount: 0,
  });

  const [isPending, setIsPending] = useState(false);
  const [isFindingGame, setIsFindingGame] = useState(false);

  // Start a new game against computer
  const findOrCreateGame = async () => {
    if (!userId) {
      toast.error("User ID not found. Please refresh.");
      return;
    }

    setIsFindingGame(true);

    try {
      const newGameId = crypto.randomUUID();

      // Optional: Save game to database
      if (userId) {
        try {
          await supabase.from("Game").insert({
            id: newGameId,
            player1Id: userId,
            status: "ACTIVE",
            updatedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error("Error saving game:", error);
          // Non-critical, continue even if save fails
        }
      }

      setGameState({
        turn: "RED", // Human player (RED) goes first
        board: createInitialBoard(),
        gameId: newGameId,
        winner: null,
        gameStatus: "ACTIVE", // Game starts immediately
        myColor: "RED",
        playerCount: 1,
        queueCount: 0,
      });

      toast.success("New game started! You are RED, playing against computer.");
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Failed to start game. Please try again.");
    } finally {
      setIsFindingGame(false);
    }
  };

  // Make player move
  const makePlayerMove = async (columnIndex: number) => {
    const { turn, myColor, gameStatus, board } = gameState;

    // Check if it's player's turn and game is active
    if (gameStatus !== "ACTIVE") {
      toast.warning("Game is not active.");
      return;
    }

    if (turn !== myColor) {
      toast.warning("Not your turn!");
      return;
    }

    if (isPending) {
      return;
    }

    // Check if move is valid
    if (!isValidMove(board, columnIndex)) {
      toast.warning("Invalid move. Column is full.");
      return;
    }

    setIsPending(true);

    try {
      // Make the player's move
      const newBoard = makeMove(board, columnIndex, "RED");

      // Check if player won
      const playerWon = checkWin(newBoard, "RED");
      const isTie = !playerWon && checkTie(newBoard);

      if (playerWon) {
        setGameState({
          ...gameState,
          board: newBoard,
          winner: "RED",
          gameStatus: "COMPLETED",
          turn: null,
        });
        toast.success("You win!");
        setIsPending(false);
        return;
      }

      if (isTie) {
        setGameState({
          ...gameState,
          board: newBoard,
          winner: "TIE",
          gameStatus: "COMPLETED",
          turn: null,
        });
        toast.info("It's a tie!");
        setIsPending(false);
        return;
      }

      // Update state after player's move
      setGameState({
        ...gameState,
        board: newBoard,
        turn: "BLUE", // Computer's turn
      });

      // Computer makes a move with a slight delay
      setTimeout(() => {
        makeComputerMove(newBoard);
      }, 750);
    } catch (error) {
      console.error("Error making move:", error);
      toast.error("Failed to make move");
      setIsPending(false);
    }
  };

  // Computer makes a move
  const makeComputerMove = (currentBoard: BoardState) => {
    try {
      // Find valid moves
      const validColumns: number[] = [];
      for (let col = 0; col < COLS; col++) {
        if (isValidMove(currentBoard, col)) {
          validColumns.push(col);
        }
      }

      if (validColumns.length === 0) {
        // No valid moves (should not happen)
        setIsPending(false);
        return;
      }

      // Simple strategy: Look for winning moves, then block opponent's winning moves
      let selectedColumn = -1;

      // Check if computer can win in one move
      for (const col of validColumns) {
        const tempBoard = makeMove(currentBoard, col, "BLUE");
        if (checkWin(tempBoard, "BLUE")) {
          selectedColumn = col;
          break;
        }
      }

      // If no winning move, check if need to block human player
      if (selectedColumn === -1) {
        for (const col of validColumns) {
          const tempBoard = makeMove(currentBoard, col, "RED");
          if (checkWin(tempBoard, "RED")) {
            selectedColumn = col;
            break;
          }
        }
      }

      // If no winning or blocking move, select a random valid column
      if (selectedColumn === -1) {
        selectedColumn =
          validColumns[Math.floor(Math.random() * validColumns.length)];
      }

      // Make computer's move
      const newBoard = makeMove(currentBoard, selectedColumn, "BLUE");

      // Check if computer won
      const computerWon = checkWin(newBoard, "BLUE");
      const isTie = !computerWon && checkTie(newBoard);

      if (computerWon) {
        setGameState((prev) => ({
          ...prev,
          board: newBoard,
          winner: "BLUE",
          gameStatus: "COMPLETED",
          turn: null,
        }));
        toast.error("Computer wins!");
      } else if (isTie) {
        setGameState((prev) => ({
          ...prev,
          board: newBoard,
          winner: "TIE",
          gameStatus: "COMPLETED",
          turn: null,
        }));
        toast.info("It's a tie!");
      } else {
        setGameState((prev) => ({
          ...prev,
          board: newBoard,
          turn: "RED", // Back to human player
        }));
      }
    } catch (error) {
      console.error("Error in computer move:", error);
    } finally {
      setIsPending(false);
    }
  };

  return {
    gameState,
    isPending,
    isFindingGame,
    findOrCreateGame,
    makePlayerMove,
  };
}
