// components/game/GameInfo.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import type { Player } from "@/lib/types"; // Import Player type

interface GameInfoProps {
  turn: Player | null;
  playerCount: number;
  queueCount: number;
  onPlayClick?: () => void;
  winner: Player | "TIE" | null; // Receive winner status
  gameStatus: "WAITING" | "ACTIVE" | "COMPLETED"; // Receive game status
}

const GameInfo: React.FC<GameInfoProps> = ({
  turn,
  playerCount = 0,
  queueCount = 0,
  onPlayClick,
  winner,
  gameStatus,
}) => {
  let statusText: string;
  let statusColor: string = "text-gray-500"; // Default color

  if (gameStatus === "COMPLETED") {
    if (winner === "TIE") {
      statusText = "It's a TIE!";
      statusColor = "text-yellow-600 dark:text-yellow-400";
    } else if (winner) {
      statusText = `${winner} WINS!`;
      statusColor =
        winner === "RED"
          ? "text-red-600 dark:text-red-400 font-bold"
          : "text-blue-600 dark:text-blue-400 font-bold";
    } else {
      statusText = "Game Over"; // Should ideally have winner/tie if completed
    }
  } else if (gameStatus === "ACTIVE" && turn) {
    statusText = `${turn}'s Turn`;
    statusColor =
      turn === "RED"
        ? "text-red-600 dark:text-red-400"
        : "text-blue-600 dark:text-blue-400";
  } else {
    statusText = "Waiting for game...";
  }

  return (
    <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 shadow-md text-center space-y-3 min-h-[150px]">
      {" "}
      {/* Added min-height */}
      <h2 className="text-xl font-semibold">Game Status</h2>
      {/* Status Text (Turn or Winner/Tie) */}
      <p className={`text-lg font-medium ${statusColor} h-6`}>
        {" "}
        {/* Added height to prevent layout shift */}
        {statusText}
      </p>
      {/* Player/Queue Counts */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <span>Playing: {playerCount}</span> |{" "}
        <span>In Queue: {queueCount}</span>
      </div>
      {/* Play Button - Conditionally render or disable */}
      {(gameStatus === "WAITING" || gameStatus === "COMPLETED") &&
        onPlayClick && (
          <Button
            onClick={onPlayClick}
            variant="secondary"
            size="lg"
            className="mt-4"
          >
            {gameStatus === "COMPLETED" ? "Play Again?" : "Find Game"}
          </Button>
        )}
    </div>
  );
};

export default GameInfo;
