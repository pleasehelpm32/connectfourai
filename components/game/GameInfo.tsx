// components/game/GameInfo.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */

import React from "react";
import { Button } from "@/components/ui/button";
import type { Player } from "@/lib/types";
import type { GameStatus } from "@prisma/client";

interface GameInfoProps {
  turn: Player | null;
  playerCount: number;
  queueCount: number;
  onPlayClick?: () => void;
  winner: Player | "TIE" | null;
  gameStatus: GameStatus;
  gameId: string | null;
  findingGame: boolean;
  myColor: Player | null;
  username: string;
}
// Update the GameInfo component to show it's a computer game
const GameInfo: React.FC<GameInfoProps> = ({
  turn,
  onPlayClick,
  winner,
  gameStatus,
  gameId,
  myColor,
  username,
  ...props
}) => {
  let statusText: string;
  let statusColor: string = "text-gray-500";

  // Handle game states for computer opponent
  if (!gameId) {
    statusText = "Click 'Play Against Computer' to start";
  } else if (gameStatus === "COMPLETED") {
    if (winner === "TIE") {
      statusText = "It's a TIE!";
      statusColor = "text-yellow-600 dark:text-yellow-400";
    } else if (winner === "RED") {
      statusText = "You WIN!";
      statusColor = "text-red-600 dark:text-red-400 font-bold";
    } else {
      statusText = "Computer WINS!";
      statusColor = "text-blue-600 dark:text-blue-400 font-bold";
    }
  } else if (gameStatus === "ACTIVE" && turn) {
    statusText = turn === "RED" ? "Your Turn" : "Computer Thinking...";
    statusColor =
      turn === "RED"
        ? "text-green-600 dark:text-green-400"
        : "text-blue-600 dark:text-blue-400";
  } else {
    statusText = "...";
  }

  // Play button logic
  const showPlayButton = (!gameId || gameStatus === "COMPLETED") && onPlayClick;
  const playButtonText =
    gameStatus === "COMPLETED" ? "Play Again" : "Play Against Computer";

  return (
    <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 shadow-md text-center space-y-3 min-h-[180px]">
      <h2 className="text-xl font-semibold">Game Status</h2>

      {/* Status Text */}
      <p className={`text-lg font-medium ${statusColor} h-6`}>{statusText}</p>

      {/* Turn Indicator */}
      {gameStatus === "ACTIVE" && (
        <div
          className={`text-sm font-medium mt-2 ${
            turn === "RED"
              ? "text-green-600 dark:text-green-400"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {turn === "RED" ? "Your turn (RED)" : "Computer's turn (BLUE)"}
        </div>
      )}

      {/* Game ID (for debugging) */}
      {gameId && process.env.NODE_ENV === "development" && (
        <div className="text-xs text-gray-500 dark:text-gray-500 mt-2 opacity-60">
          Game ID: {gameId.substring(0, 8)}...
        </div>
      )}

      {/* Play Button */}
      {showPlayButton && (
        <Button
          onClick={onPlayClick}
          variant="secondary"
          size="lg"
          className="mt-4"
        >
          {playButtonText}
        </Button>
      )}
    </div>
  );
};

export default GameInfo;
