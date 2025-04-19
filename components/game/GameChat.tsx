// components/game/GameChat.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import type { BoardState, Player } from "@/lib/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface GameChatProps {
  gameId: string | null;
  board: BoardState;
  currentTurn: Player | null;
  myColor: Player | null;
  username: string;
  difficultyLevel: "easy" | "medium" | "hard" | "impossible";
}
export default function GameChat({
  gameId,
  board,
  currentTurn,
  myColor,
  username,
  difficultyLevel,
}: GameChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your Connect Four assistant. Ask me for move advice or strategy tips.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Add user message to chat
    const userMessage = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Prepare the board for the AI
    // Convert to a format that's easier for the AI to analyze
    const boardString = board
      .map((row) =>
        row
          .map((cell) => (cell === "EMPTY" ? "." : cell === "RED" ? "R" : "B"))
          .join("")
      )
      .join("\n");

    // Examples of good analyses
    const winningMoveExample = `
Board:
.......
.......
.......
.......
.R.....
RRB....

Analysis: I can see that RED has two pieces in column 0 and one in column 1. If RED plays in column 2, they'll have three in a row and be one move away from winning. I recommend playing in column 2.`;

    const blockingExample = `
Board:
.......
.......
.......
.......
.B.....
RRBB...

Analysis: I see that BLUE has two pieces in a row in columns 3 and 4. If BLUE plays in column 5, they'll have three in a row and be one move away from winning. RED should block by playing in column 5.`;

    const winDetectionExample = `
Board:
.......
.......
.......
.B.....
.BR....
RBRR...

Analysis: I see RED has three pieces in a row in columns 1, 2, and 3 at the bottom row. If RED plays in column 0, they'll connect four and win immediately! RED should definitely play in column 0.`;

    const strategicExample = `
Board:
.......
.......
.......
.R.....
.B.....
.RB....

Analysis: I notice that playing in column 2 would create two possible winning paths for RED - either horizontally or diagonally. This would force BLUE to block one, but RED could win through the other path. RED should play in column 2.`;

    const systemPrompt = {
      role: "system" as const,
      content: `You are an expert Connect Four game assistant. Analyze the board carefully and provide precise, helpful advice.

Current board state (. = empty, R = RED, B = BLUE):
${boardString}

Current turn: ${currentTurn || "None"}
User's color: ${myColor || "None"}
Difficulty level: ${difficultyLevel}

IMPORTANT RULES:
1. ALWAYS check for winning moves (4 in a row) and point them out
2. ALWAYS check for blocking moves when opponent is about to win
3. Look for "threats" - setups that create two winning paths
4. When recommending a move, specify the column number (0-6)
5. Keep responses brief but clear
6. Pay special attention to three-in-a-row patterns that could be extended to win

Here are examples of excellent analyses:${winningMoveExample}${blockingExample}${winDetectionExample}${strategicExample}

Answer questions concisely and accurately. When asked for move recommendations, analyze the board thoroughly using the rules above. Be especially careful to never miss a winning move or a move that blocks an opponent from winning.`,
    };

    try {
      // Prepare conversation history (limit to last 5 messages for context)
      const conversationHistory = [
        systemPrompt,
        ...messages.slice(-5).map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        userMessage,
      ];

      // Send to OpenAI via our API route
      const response = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationHistory,
          model: "gpt-3.5-turbo",
          temperature: 0.2, // Lower temperature for more focused responses
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const aiMessage = await response.json();

      // Add AI response to chat
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: aiMessage.content,
        },
      ]);
    } catch (error) {
      console.error("Error in AI communication:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I had trouble processing that. Can you try again?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!gameId) return null;

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md h-[400px] overflow-hidden">
      <div className="p-2 border-b bg-gray-100 dark:bg-gray-700 rounded-t-lg">
        <h3 className="font-medium text-sm">Game Assistant</h3>
      </div>

      {/* Fixed height container with automatic scrolling */}
      <div
        ref={scrollAreaRef}
        className="flex-1 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300"
      >
        <div className="space-y-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-lg ${
                  message.role === "user"
                    ? "bg-blue-500 text-white rounded-tr-none"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-tl-none"
                }`}
              >
                <div className="text-xs mb-1 opacity-75">
                  {message.role === "user" ? username : "AI"}
                </div>
                <div className="text-sm">{message.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-600">
                <div className="text-xs mb-1 opacity-75">AI</div>
                <Loader2 className="animate-spin h-4 w-4" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area - fixed at bottom */}
      <div className="p-2 border-t mt-auto bg-white dark:bg-gray-700">
        <div className="flex gap-2">
          <Input
            placeholder="Ask for advice or just chat..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 h-9 text-sm"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading}
            size="sm"
            className="h-9"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
