// Updated app/game/page.tsx layout
"use client";

import React from "react";
import GameBoard from "@/components/game/GameBoard";
import GameInfo from "@/components/game/GameInfo";
import GameChat from "@/components/game/GameChat";
import UsernameForm from "@/components/user/UsernameForm";
import { useUser } from "@/app/hooks/useUser";
import { useGame } from "@/app/hooks/useGame";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function GamePage() {
  const { userId, username, isLoading: userLoading, setUsername } = useUser();

  const {
    gameState,
    isPending,
    isFindingGame,
    findOrCreateGame,
    makePlayerMove,
    difficulty,
    setDifficulty,
  } = useGame(userId);

  if (userLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-pulse text-lg">Loading user data...</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-gray-50 dark:bg-gray-900">
      {/* Header with Title, Username, and Difficulty */}
      <div className="w-full max-w-md md:max-w-4xl mb-4">
        <div className="flex flex-row items-center justify-between gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200">
            Connect 4
          </h1>

          <div className="flex flex-row gap-2">
            {/* Username display/edit - compact */}
            {userId && username && (
              <div className="flex items-center">
                <span className="mr-2 text-sm hidden md:inline">
                  Playing as:
                </span>
                <div className="inline-block text-sm">
                  <span>{username}</span>
                  <button
                    onClick={() =>
                      document.getElementById("usernameEdit")?.click()
                    }
                    className="ml-2 text-blue-500 hover:text-blue-700 text-xs"
                  >
                    Edit
                  </button>
                  <div className="hidden">
                    <UsernameForm
                      userId={userId}
                      currentUsername={username}
                      onUpdate={setUsername}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Difficulty Selector - compact */}
            <div>
              <Select
                value={difficulty}
                onValueChange={(value) => setDifficulty(value as any)}
              >
                <SelectTrigger className="h-8 text-sm min-w-[110px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="impossible">Impossible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex flex-col md:flex-row items-start gap-4 w-full max-w-4xl">
        {/* Left Column: Game Board and Controls */}
        <div className="w-full md:w-auto mx-auto md:mx-0 flex flex-col items-center">
          <GameBoard
            boardState={gameState.board}
            disabled={
              gameState.gameStatus !== "ACTIVE" ||
              gameState.turn !== gameState.myColor ||
              isPending
            }
            onColumnClick={makePlayerMove}
          />

          {/* Game controls below the board */}
          <div className="mt-4 w-full flex flex-col items-center">
            {/* Game Status */}
            <div className="text-center mb-2">
              {gameState.gameStatus === "ACTIVE" && (
                <div className="font-medium text-lg">
                  {gameState.turn === gameState.myColor ? (
                    <span className="text-green-600">Your Turn</span>
                  ) : (
                    <span className="text-blue-600">Computer's Turn...</span>
                  )}
                </div>
              )}

              {gameState.gameStatus === "COMPLETED" && (
                <div className="font-medium text-lg">
                  {gameState.winner === gameState.myColor ? (
                    <span className="text-green-600 font-bold">You WIN!</span>
                  ) : gameState.winner === "TIE" ? (
                    <span className="text-yellow-600">It's a Tie!</span>
                  ) : (
                    <span className="text-red-600">Computer Wins</span>
                  )}
                </div>
              )}

              {gameState.gameStatus === "WAITING" && (
                <div className="font-medium text-lg text-gray-600">
                  Start a new game
                </div>
              )}
            </div>

            {/* Play/Play Again Button */}
            <Button
              onClick={findOrCreateGame}
              disabled={isFindingGame}
              size="lg"
              className="w-1/2 md:w-40"
            >
              {gameState.gameStatus === "COMPLETED" ? "Play Again" : "Play Now"}
            </Button>

            {isPending && (
              <p className="text-center mt-2 text-sm text-gray-500">
                {isFindingGame ? "Starting game..." : "Processing move..."}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Game Info & Chat */}
        <div className="w-full md:w-96 mt-4 md:mt-0">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="info">Game Info</TabsTrigger>
              <TabsTrigger value="chat">AI Chat</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-2">
              <GameInfo
                gameId={gameState.gameId}
                gameStatus={gameState.gameStatus}
                turn={gameState.turn}
                playerCount={1}
                queueCount={0}
                winner={gameState.winner}
                findingGame={isFindingGame}
                myColor={gameState.myColor}
                username={username || "Guest"}
                difficulty={difficulty}
              />
            </TabsContent>

            <TabsContent value="chat" className="mt-2">
              <GameChat
                gameId={gameState.gameId}
                board={gameState.board}
                currentTurn={gameState.turn}
                myColor={gameState.myColor}
                username={username || "Guest"}
                difficultyLevel={difficulty}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <footer className="mt-4 text-xs text-gray-500">
        Connect 4 Game - AI Edition
      </footer>
    </main>
  );
}
