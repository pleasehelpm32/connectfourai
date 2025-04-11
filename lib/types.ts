// lib/types.ts (or at the top of lib/gameLogic.ts)

export type Player = "RED" | "BLUE";
export type SlotState = Player | "EMPTY";
export type BoardState = SlotState[][]; // A 2D array representing the grid
