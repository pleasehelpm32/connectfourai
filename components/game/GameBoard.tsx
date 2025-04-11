// components/game/GameBoard.tsx
import React from "react";
import GameSlot from "./GameSlot";
import type { BoardState } from "@/lib/types"; // Import BoardState type
import { COLS } from "@/lib/gameLogic"; // Import COLS

interface GameBoardProps {
  boardState: BoardState; // Receive board state as prop
  onColumnClick: (columnIndex: number) => void; // Receive click handler
  disabled?: boolean; // Optional: To disable clicks
}

const GameBoard: React.FC<GameBoardProps> = ({
  boardState,
  onColumnClick,
  disabled = false,
}) => {
  // Calculate hover effect class based on disabled state
  const columnHoverClass = !disabled
    ? "hover:bg-yellow-200 dark:hover:bg-yellow-800 opacity-50"
    : "";

  return (
    <div className="bg-blue-600 dark:bg-blue-800 p-2 md:p-4 rounded-lg shadow-xl inline-block">
      {/* Use relative positioning to allow absolute positioning for column overlays */}
      <div className="relative grid grid-cols-7 gap-1 md:gap-2">
        {/* Render the visual slots */}
        {boardState.map((row, rowIndex) =>
          row.map((slotState, colIndex) => (
            <GameSlot
              key={`${rowIndex}-${colIndex}`}
              state={slotState} // Pass the actual state from the board
              // onClick is now handled by the column overlay for better UX
            />
          ))
        )}

        {/* Invisible Column Overlays for Click Handling */}
        {Array.from({ length: COLS }).map((_, colIndex) => (
          <div
            key={`col-${colIndex}`}
            className={`absolute top-0 bottom-0 left-${
              ((colIndex * 1) / 7) * 100
            }% right-${(((COLS - 1 - colIndex) * 1) / 7) * 100}% w-${
              (1 / 7) * 100
            }% // Tailwind needs full class names, JIT might work otherwise manual calc needed
                        cursor-pointer ${columnHoverClass} transition-colors duration-150 z-10 rounded-md
                        ${disabled ? "cursor-not-allowed" : ""}`}
            style={{
              // Using style for calculated widths/positions as Tailwind JIT might not cover all fractions needed reliably
              left: `${(colIndex / COLS) * 100}%`,
              width: `${(1 / COLS) * 100}%`,
            }}
            onClick={() => !disabled && onColumnClick(colIndex)}
            aria-label={`Play in column ${colIndex + 1}`}
            role="button"
            tabIndex={disabled ? -1 : 0} // Make columns focusable when not disabled
            onKeyDown={(e) => {
              // Allow activation with Enter/Space
              if (!disabled && (e.key === "Enter" || e.key === " ")) {
                onColumnClick(colIndex);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default GameBoard;
