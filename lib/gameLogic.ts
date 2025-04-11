// lib/gameLogic.ts

import type { Player, SlotState, BoardState } from "./types"; // Adjust path if types are elsewhere

// --- Constants ---
export const ROWS = 6;
export const COLS = 7;

// --- Functions ---

/**
 * Creates a new empty game board.
 * @returns {BoardState} A 6x7 2D array filled with 'EMPTY'.
 */
export function createInitialBoard(): BoardState {
  return Array(ROWS)
    .fill(null)
    .map(() => Array(COLS).fill("EMPTY"));
}

/**
 * Checks if a move is valid in the given column.
 * @param board The current board state.
 * @param column The column index (0-6).
 * @returns {boolean} True if the column is within bounds and not full.
 */
export function isValidMove(board: BoardState, column: number): boolean {
  // Check column bounds
  if (column < 0 || column >= COLS) {
    return false;
  }
  // Check if the top slot in the column is empty
  return board[0][column] === "EMPTY";
}

/**
 * Creates a *new* board state with the player's piece added to the column.
 * Assumes the move is valid (call isValidMove first).
 * @param board The current board state.
 * @param column The column index where the piece is dropped.
 * @param player The player ('RED' or 'BLUE') making the move.
 * @returns {BoardState} A new board state reflecting the move.
 */
export function makeMove(
  board: BoardState,
  column: number,
  player: Player
): BoardState {
  // Create a deep copy to ensure immutability
  const newBoard = board.map((row) => [...row]);

  // Find the lowest empty row in the column
  for (let r = ROWS - 1; r >= 0; r--) {
    if (newBoard[r][column] === "EMPTY") {
      newBoard[r][column] = player;
      return newBoard; // Return the updated board
    }
  }
  // Should not happen if isValidMove was checked, but return original board as fallback
  console.warn("makeMove called on a full column or invalid state.");
  return newBoard; // Or throw an error? Returning newBoard avoids mutation.
}

/**
 * Checks if the specified player has won.
 * @param board The current board state.
 * @param player The player ('RED' or 'BLUE') to check for a win.
 * @returns {boolean} True if the player has four in a row horizontally, vertically, or diagonally.
 */
export function checkWin(board: BoardState, player: Player): boolean {
  // Check horizontal wins
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (
        board[r][c] === player &&
        board[r][c + 1] === player &&
        board[r][c + 2] === player &&
        board[r][c + 3] === player
      ) {
        return true;
      }
    }
  }

  // Check vertical wins
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c < COLS; c++) {
      if (
        board[r][c] === player &&
        board[r + 1][c] === player &&
        board[r + 2][c] === player &&
        board[r + 3][c] === player
      ) {
        return true;
      }
    }
  }

  // Check diagonal (down-right) wins
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (
        board[r][c] === player &&
        board[r + 1][c + 1] === player &&
        board[r + 2][c + 2] === player &&
        board[r + 3][c + 3] === player
      ) {
        return true;
      }
    }
  }

  // Check diagonal (up-right / down-left) wins
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (
        board[r][c] === player &&
        board[r - 1][c + 1] === player &&
        board[r - 2][c + 2] === player &&
        board[r - 3][c + 3] === player
      ) {
        return true;
      }
    }
  }

  return false; // No win found
}

/**
 * Checks if the game is a tie (board is full).
 * Assumes checkWin was called first and returned false.
 * @param board The current board state.
 * @returns {boolean} True if all slots are filled.
 */
export function checkTie(board: BoardState): boolean {
  // If any slot in the top row is empty, the board isn't full
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === "EMPTY") {
      return false;
    }
  }
  // If the top row is full, the board is full (assuming gravity)
  return true;
}
