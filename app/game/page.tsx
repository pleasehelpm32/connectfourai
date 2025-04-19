// app/game/page.tsx
"use client";

import React from "react";
import GameBoard from "@/components/game/GameBoard";
import GameInfo from "@/components/game/GameInfo";
import UsernameForm from "@/components/user/UsernameForm";

import { useUser } from "@/app/hooks/useUser";
import { useGame } from "@/app/hooks/useGame";

export default function GamePage() {
  const { userId, username, isLoading: userLoading, setUsername } = useUser();

  const {
    gameState,
    isPending,
    isFindingGame,
    findOrCreateGame,
    makePlayerMove,
  } = useGame(userId);

  if (userLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-pulse text-lg">Loading user data...</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 dark:text-gray-200">
        Connect 4
      </h1>

      {/* Username Management */}
      {userId && username && (
        <div className="w-full max-w-md mb-6">
          <UsernameForm
            userId={userId}
            currentUsername={username}
            onUpdate={setUsername}
          />
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 md:gap-10">
        {/* Game Board Area */}
        <div className="flex-shrink-0">
          <GameBoard
            boardState={gameState.board}
            disabled={
              gameState.gameStatus !== "ACTIVE" ||
              gameState.turn !== gameState.myColor ||
              isPending ||
              isFindingGame
            }
            onColumnClick={makePlayerMove}
          />
          {(isPending || isFindingGame) && (
            <p className="text-center mt-2 text-sm text-gray-500">
              {isFindingGame ? "Finding game..." : "Processing move..."}
            </p>
          )}
        </div>

        {/* Game Info & Controls Area */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <GameInfo
            turn={gameState.turn}
            playerCount={gameState.playerCount}
            queueCount={gameState.queueCount}
            onPlayClick={findOrCreateGame}
            winner={gameState.winner}
            gameStatus={gameState.gameStatus}
            gameId={gameState.gameId}
            findingGame={isFindingGame}
            myColor={gameState.myColor}
            username={username || "Guest"}
          />
        </div>
      </div>

      <footer className="mt-8 text-xs text-gray-500">
        Connect 4 Game - Real-time Edition
      </footer>
    </main>
  );
}
