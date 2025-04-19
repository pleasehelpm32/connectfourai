// components/ui/spinner.tsx
import React from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
}

export function Spinner({ size = "md" }: SpinnerProps) {
  const sizeClass = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }[size];

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizeClass} animate-spin rounded-full border-4 border-gray-300 border-t-blue-600`}
      ></div>
    </div>
  );
}
