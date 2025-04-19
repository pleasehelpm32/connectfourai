// hooks/useGame.ts
"use client";

import { useState } from "react";
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
  ROWS,
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
  const [difficulty, setDifficulty] = useState<
    "easy" | "medium" | "hard" | "impossible"
  >("easy");

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

  // Function to detect if a player can win in one move
  const detectWinningMove = (board: BoardState, player: Player): number => {
    for (let col = 0; col < COLS; col++) {
      if (isValidMove(board, col)) {
        const tempBoard = makeMove(board, col, player);
        if (checkWin(tempBoard, player)) {
          return col;
        }
      }
    }
    return -1; // No winning move found
  };

  // Function to detect if a player can create a two-way threat
  const detectTwoWayThreat = (board: BoardState, player: Player): number => {
    const validColumns: number[] = [];

    for (let col = 0; col < COLS; col++) {
      if (isValidMove(board, col)) {
        validColumns.push(col);
      }
    }

    // Check each valid column
    for (const col of validColumns) {
      // Make a move in this column
      const tempBoard = makeMove(board, col, player);

      // Count how many winning moves this creates
      let winningMoves = 0;
      let winningColumns = [];

      for (const nextCol of validColumns) {
        if (nextCol === col) continue; // Skip the column we just placed in

        if (isValidMove(tempBoard, nextCol)) {
          const nextBoard = makeMove(tempBoard, nextCol, player);
          if (checkWin(nextBoard, player)) {
            winningMoves++;
            winningColumns.push(nextCol);
          }
        }
      }

      // If this creates multiple winning opportunities, it's a two-way threat
      if (winningMoves >= 2) {
        console.log(
          `Detected two-way threat: ${player} placing in column ${col} creates wins at columns ${winningColumns.join(
            ", "
          )}`
        );
        return col; // This is the column that creates a two-way threat
      }
    }

    return -1; // No two-way threat detected
  };

  // Function to check for three in a row with open ends (horizontal)
  const checkThreeInRow = (board: BoardState, player: Player): number => {
    // Check bottom row for three in a row with open ends
    const bottomRow = ROWS - 1;

    // Check horizontal sequences
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col <= COLS - 3; col++) {
        // Check for three in a row with an open end on the right
        if (
          col + 3 < COLS &&
          board[row][col] === player &&
          board[row][col + 1] === player &&
          board[row][col + 2] === player &&
          board[row][col + 3] === "EMPTY" &&
          (row === ROWS - 1 || board[row + 1][col + 3] !== "EMPTY")
        ) {
          return col + 3; // Block the right side
        }

        // Check for three in a row with an open end on the left
        if (
          col > 0 &&
          board[row][col] === "EMPTY" &&
          board[row][col + 1] === player &&
          board[row][col + 2] === player &&
          board[row][col + 3] === player &&
          (row === ROWS - 1 || board[row + 1][col] !== "EMPTY")
        ) {
          return col; // Block the left side
        }
      }
    }

    return -1; // No dangerous three in a row found
  };

  // Advanced algorithm for impossible difficulty
  const makeImpossibleMove = (currentBoard: BoardState): number => {
    const opponent = "RED"; // Human player
    const player = "BLUE"; // Computer

    const validColumns: number[] = [];
    for (let col = 0; col < COLS; col++) {
      if (isValidMove(currentBoard, col)) {
        validColumns.push(col);
      }
    }

    if (validColumns.length === 0) return -1;

    // 1. Check for immediate win
    const winningMove = detectWinningMove(currentBoard, player);
    if (winningMove >= 0) {
      console.log(`AI found winning move at column ${winningMove}`);
      return winningMove;
    }

    // 2. Check for opponent's winning move to block
    const blockingMove = detectWinningMove(currentBoard, opponent);
    if (blockingMove >= 0) {
      console.log(`AI blocking opponent win at column ${blockingMove}`);
      return blockingMove;
    }

    // 3. Check for three in a row with open ends (very dangerous)
    const threeInRowBlock = checkThreeInRow(currentBoard, opponent);
    if (threeInRowBlock >= 0) {
      console.log(`AI blocking three in a row at column ${threeInRowBlock}`);
      return threeInRowBlock;
    }

    // 4. Check for two pieces in a row at the bottom with open ends on both sides
    // This is the specific pattern from your screenshot
    const bottomRow = currentBoard[ROWS - 1];
    for (let col = 1; col <= COLS - 3; col++) {
      if (
        bottomRow[col - 1] === "EMPTY" &&
        bottomRow[col] === opponent &&
        bottomRow[col + 1] === opponent &&
        bottomRow[col + 2] === "EMPTY"
      ) {
        // Block either end, prioritize the left
        console.log(`AI blocking potential two-way threat at the bottom row`);
        return col - 1;
      }
    }

    // 5. Check for opponent's two-way threat setup
    for (const col of validColumns) {
      const tempBoard = makeMove(currentBoard, col, opponent);
      if (detectTwoWayThreat(tempBoard, opponent) >= 0) {
        console.log(
          `AI blocking potential two-way threat setup at column ${col}`
        );
        return col;
      }
    }

    // 6. Try to create own two-way threat
    const threatMove = detectTwoWayThreat(currentBoard, player);
    if (threatMove >= 0) {
      console.log(`AI creating two-way threat at column ${threatMove}`);
      return threatMove;
    }

    // 7. Prefer center columns for strategic advantage
    const preferredOrder = [3, 2, 4, 1, 5, 0, 6]; // Center first, then moving outward
    for (const col of preferredOrder) {
      if (validColumns.includes(col)) {
        return col;
      }
    }

    // Fallback to first valid column
    return validColumns[0];
  };

  // Find best move for non-impossible difficulties
  const findBestMove = (
    board: BoardState,
    player: Player,
    difficulty: string
  ): number => {
    const opponent = player === "RED" ? "BLUE" : "RED";
    const validColumns: number[] = [];

    for (let col = 0; col < COLS; col++) {
      if (isValidMove(board, col)) {
        validColumns.push(col);
      }
    }

    if (validColumns.length === 0) return -1;

    // 1. Check for winning moves
    for (const col of validColumns) {
      const tempBoard = makeMove(board, col, player);
      if (checkWin(tempBoard, player)) {
        return col; // Immediate win
      }
    }

    // 2. Check for blocking opponent's winning moves
    for (const col of validColumns) {
      const tempBoard = makeMove(board, col, opponent);
      if (checkWin(tempBoard, opponent)) {
        return col; // Block opponent
      }
    }

    // 3. For hard, additional strategy
    if (difficulty === "hard") {
      // Try to place in the center as it offers most winning paths
      if (validColumns.includes(3)) {
        return 3;
      }

      // Otherwise prefer columns near the center
      const centerPreference = [3, 2, 4, 1, 5, 0, 6];
      for (const col of centerPreference) {
        if (validColumns.includes(col)) {
          return col;
        }
      }
    }

    // 4. For other difficulties, pick random but prefer center
    const centerPreference =
      difficulty === "medium"
        ? [3, 2, 4, 1, 5, 0, 6] // For medium, still have some strategy
        : validColumns; // For easy, fully random

    return centerPreference[
      Math.floor(Math.random() * centerPreference.length)
    ];
  };

  // AI move with LLM and fallback
  const makeAiMove = async (currentBoard: BoardState) => {
    try {
      setIsPending(true);

      // For impossible difficulty, first use our guaranteed algorithmic approach
      if (difficulty === "impossible") {
        const algorithmicMove = makeImpossibleMove(currentBoard);

        if (
          algorithmicMove >= 0 &&
          isValidMove(currentBoard, algorithmicMove)
        ) {
          console.log(
            "Using algorithmic move for impossible difficulty:",
            algorithmicMove
          );

          // Make the move determined by our algorithm
          const newBoard = makeMove(currentBoard, algorithmicMove, "BLUE");

          // Check for win or tie
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
            toast.error("AI wins!");
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

          setIsPending(false);
          return; // Exit early, move made successfully
        }
      }

      // For non-impossible difficulties or as a backup, use the LLM
      const boardString = currentBoard
        .map((row) =>
          row
            .map((cell) =>
              cell === "EMPTY" ? "." : cell === "RED" ? "R" : "B"
            )
            .join("")
        )
        .join("\n");

      const messages = [
        {
          role: "system",
          content: `You are a Connect Four AI player at ${difficulty} difficulty. 
Current board state (. = empty, R = RED, B = BLUE):
${boardString}

You are playing as BLUE. Your job is to choose the best column (0-6) to drop your piece.
Based on the current board state and the ${difficulty} difficulty level, analyze the board and provide ONLY the column number (0-6) where you want to make your move.

Difficulty levels:
- easy: Make valid moves with occasional blocking
- medium: Block opponent's winning moves and make winning moves when obvious
- hard: Use strategy to set up future winning positions
- impossible: Use perfect play, considering multiple moves ahead

IMPORTANT:
- ALWAYS check for immediate winning moves (connecting 4) and take them
- ALWAYS check if the opponent can win next turn and block when necessary 
- Consider the center columns as strategically valuable

Respond with ONLY a single digit from 0-6 representing your chosen column.`,
        },
      ];

      // Call OpenAI API via the server route
      const response = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          model: "gpt-3.5-turbo",
          temperature:
            difficulty === "easy" ? 0.9 : difficulty === "medium" ? 0.5 : 0.2,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI move");
      }

      const aiResponse = await response.json();

      // Parse the response to get the column number
      const columnText = aiResponse.content.trim();
      const columnMatch = columnText.match(/[0-6]/);
      let columnIndex = columnMatch ? parseInt(columnMatch[0]) : -1;

      // Validate the move
      if (
        columnIndex < 0 ||
        columnIndex >= 7 ||
        !isValidMove(currentBoard, columnIndex)
      ) {
        console.warn("AI returned invalid move:", columnText);

        // Use algorithmic approach as fallback
        columnIndex =
          difficulty === "impossible"
            ? makeImpossibleMove(currentBoard)
            : findBestMove(currentBoard, "BLUE", difficulty);
      }

      // Make the move
      const newBoard = makeMove(currentBoard, columnIndex, "BLUE");

      // Check for win or tie
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
        toast.error("AI wins!");
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
      console.error("Error in AI move:", error);
      // Fall back to simple computer move
      makeComputerMove(currentBoard);
    } finally {
      setIsPending(false);
    }
  };

  // Simple computer move logic (used as fallback)
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
        // For impossible difficulty, always use the algorithmic/LLM approach
        if (difficulty === "impossible") {
          makeAiMove(newBoard);
        }
        // For other difficulties, mix algorithmic and simple approaches
        else if (difficulty === "easy" && Math.random() < 0.7) {
          makeComputerMove(newBoard); // Simple for easy
        } else {
          makeAiMove(newBoard); // LLM for medium/hard and sometimes easy
        }
      }, 750);
    } catch (error) {
      console.error("Error making move:", error);
      toast.error("Failed to make move");
      setIsPending(false);
    }
  };

  return {
    gameState,
    isPending,
    isFindingGame,
    findOrCreateGame,
    makePlayerMove,
    difficulty,
    setDifficulty,
  };
}
