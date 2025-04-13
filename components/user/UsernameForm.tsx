// components/user/UsernameForm.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateUsername } from "@/app/actions/userActions";

interface UsernameFormProps {
  userId: string;
  currentUsername: string;
  onUpdate: (newName: string) => void;
}

export default function UsernameForm({
  userId,
  currentUsername,
  onUpdate,
}: UsernameFormProps) {
  const [username, setUsername] = useState(currentUsername);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (username === currentUsername) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateUsername(userId, username);

      if (result.success) {
        toast.success("Username updated successfully!");
        onUpdate(result.name || "");
        setIsEditing(false);
      } else {
        toast.error(result.message || "Failed to update username");
      }
    } catch (error) {
      toast.error("An error occurred while updating username");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <span className="font-medium">{currentUsername}</span>
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          Edit Name
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
        disabled={isLoading}
        className="w-full"
        maxLength={20}
        minLength={3}
        pattern="[a-zA-Z0-9_]+"
        title="Letters, numbers, and underscores only"
      />
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setUsername(currentUsername);
            setIsEditing(false);
          }}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isLoading || username === currentUsername}
        >
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
