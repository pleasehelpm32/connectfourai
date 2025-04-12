// components/game/GameInfo.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import type { Player } from "@/lib/types"; // Import Player type
import type { GameStatus } from "@prisma/client";
// In your GameInfo component:
interface GameInfoProps {
  turn: Player | null;
  playerCount: number;
  queueCount: number;
  onPlayClick?: () => void;
  winner: Player | "TIE" | null;
  gameStatus: GameStatus;
  gameId: string | null; // Add gameId to props
  findingGame: boolean; // Add this to know when the "Find Game" action is in progress
  myColor: Player | null;
}

const GameInfo: React.FC<GameInfoProps> = ({
  turn,
  playerCount = 0,
  queueCount = 0,
  onPlayClick,
  winner,
  gameStatus,
  gameId,
  findingGame = false,
  myColor,
}) => {
  let statusText: string;
  let statusColor: string = "text-gray-500";

  // First check for finding game state
  if (findingGame) {
    statusText = "Finding a game...";
  }
  // Then check if no game found yet (and not currently finding)
  else if (!gameId && !findingGame) {
    statusText = "Click 'Find Game' to start";
  }
  // Then handle completed games
  else if (gameStatus === "COMPLETED") {
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
      statusText = "Game Over";
    }
  }
  // Then handle active games
  else if (gameStatus === "ACTIVE" && turn) {
    statusText = `${turn}'s Turn`;
    statusColor =
      turn === "RED"
        ? "text-red-600 dark:text-red-400"
        : "text-blue-600 dark:text-blue-400";
  }
  // Finally, handle waiting games
  else if (gameStatus === "WAITING") {
    statusText = "Waiting for opponent...";
  }
  // Fallback
  else {
    statusText = "...";
  }

  // Color indicator for current player
  const colorIndicator = myColor ? `(You are ${myColor})` : "";

  // Play button logic
  const showPlayButton =
    (!gameId || gameStatus === "WAITING" || gameStatus === "COMPLETED") &&
    onPlayClick;
  const playButtonText =
    gameStatus === "COMPLETED" ? "Play Again?" : "Find Game";

  return (
    <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 shadow-md text-center space-y-3 min-h-[180px]">
      <h2 className="text-xl font-semibold">Game Status</h2>
      {/* Status Text */}
      <p className={`text-lg font-medium ${statusColor} h-6`}>
        {statusText}{" "}
        <span className="text-sm font-normal">{colorIndicator}</span>
      </p>
      {/* Player/Queue Counts */}
      <div className="text-sm text-gray-600 dark:text-gray-400 mt-8">
        <span>Playing: {playerCount}</span> |{" "}
        <span>In Queue: {queueCount}</span>
      </div>
      {/* Play Button */}
      {showPlayButton && (
        <Button
          onClick={onPlayClick}
          variant="secondary"
          size="lg"
          className="mt-4"
          disabled={findingGame} // Disable while finding game
        >
          {findingGame ? "Connecting..." : playButtonText}
        </Button>
      )}
    </div>
  );
};
export default GameInfo;
