// components/game/GameSlot.tsx
import React from "react";
import { cn } from "@/lib/utils";
import type { SlotState } from "@/lib/types"; // Import SlotState type

interface GameSlotProps {
  state: SlotState; // Receive state directly
}

const GameSlot: React.FC<GameSlotProps> = ({ state }) => {
  // Responsive size
  const baseStyle =
    "w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center m-0.5 md:m-1 shadow-inner relative z-0"; // Ensure slots are behind overlays

  // Define styles for each state
  const stateStyles = {
    EMPTY:
      "bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600",
    RED: "bg-red-500 border border-red-700",
    BLUE: "bg-blue-500 border-blue-700",
  };

  // No hover or cursor styles needed here anymore

  return (
    <div
      className={cn(baseStyle, stateStyles[state])}
      aria-label={`Game slot: ${state}`}
      // No onClick, role, tabIndex, or onKeyDown needed here now
    >
      {/* Inner element for visual depth (optional) */}
      <div className="w-8 h-8 md:w-11 md:h-11 rounded-full opacity-50"></div>
    </div>
  );
};

export default GameSlot;
