// components/game/GameBoard.tsx
import React from "react";
import GameSlot from "./GameSlot";
import type { BoardState } from "@/lib/types";
import { COLS } from "@/lib/gameLogic";

interface GameBoardProps {
  boardState: BoardState;
  onColumnClick: (columnIndex: number) => void;
  disabled?: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({
  boardState,
  onColumnClick,
  disabled = false,
}) => {
  // Change hover color to green or another color
  const columnHoverClass = !disabled
    ? "hover:bg-green-200 dark:hover:bg-green-800 opacity-50"
    : "";

  return (
    // Change the board background to yellow
    <div className="bg-yellow-500 dark:bg-yellow-600 p-2 md:p-4 rounded-lg shadow-xl inline-block">
      <div className="relative grid grid-cols-7 gap-1 md:gap-2">
        {/* Render the visual slots */}
        {boardState.map((row, rowIndex) =>
          row.map((slotState, colIndex) => (
            <GameSlot key={`${rowIndex}-${colIndex}`} state={slotState} />
          ))
        )}

        {/* Invisible Column Overlays for Click Handling */}
        {Array.from({ length: COLS }).map((_, colIndex) => (
          <div
            key={`col-${colIndex}`}
            className={`absolute top-0 bottom-0 cursor-pointer ${columnHoverClass} transition-colors duration-150 z-10 rounded-md
                        ${disabled ? "cursor-not-allowed" : ""}`}
            style={{
              left: `${(colIndex / COLS) * 100}%`,
              width: `${(1 / COLS) * 100}%`,
            }}
            onClick={() => !disabled && onColumnClick(colIndex)}
            aria-label={`Play in column ${colIndex + 1}`}
            role="button"
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
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
