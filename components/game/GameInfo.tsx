// components/game/GameInfo.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */

import React from "react";
import type { Player } from "@/lib/types";
import type { GameStatus } from "@prisma/client";

interface GameInfoProps {
  turn: Player | null;
  playerCount?: number;
  queueCount?: number;
  winner?: Player | "TIE" | null;
  gameStatus: GameStatus;
  gameId: string | null;
  findingGame?: boolean;
  myColor?: Player | null;
  username?: string;
  difficulty: string;
}

const GameInfo: React.FC<GameInfoProps> = ({
  gameStatus,
  gameId,
  difficulty,
  ...props
}) => {
  const difficultyDescription =
    {
      easy: "Computer makes mostly random moves with occasional blocking.",
      medium:
        "Computer blocks your winning moves and takes obvious opportunities.",
      hard: "Computer uses strategy to set up future winning positions.",
      impossible:
        "Computer uses perfect play and is extremely difficult to beat.",
    }[difficulty] || "";

  return (
    <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 shadow-md text-sm space-y-4">
      <div>
        <h3 className="font-semibold mb-1">How To Play</h3>
        <p>
          Click on any column to drop your piece. Connect four of your pieces
          vertically, horizontally, or diagonally to win!
        </p>
      </div>

      <div>
        <h3 className="font-semibold mb-1">
          Current Difficulty: <span className="capitalize">{difficulty}</span>
        </h3>
        <p>{difficultyDescription}</p>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Strategy Tips</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>The center column gives you more winning opportunities</li>
          <li>Try to create multiple threats at once</li>
          <li>Block your opponent&rsquo;s potential connecting moves</li>
          <li>Ask the AI assistant for specific advice</li>
        </ul>
      </div>

      {gameId && (
        <div className="text-xs text-gray-500 mt-2">
          Game ID: {gameId.substring(0, 8)}...
        </div>
      )}
    </div>
  );
};

export default GameInfo;
