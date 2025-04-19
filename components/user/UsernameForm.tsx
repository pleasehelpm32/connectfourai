// components/user/UsernameForm.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

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

    // Validate username (3-20 chars, alphanumeric + underscore)
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      toast.error(
        "Username must be 3-20 characters and contain only letters, numbers, and underscores."
      );
      return;
    }

    setIsLoading(true);

    try {
      // Check if name is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from("User")
        .select("id")
        .eq("name", username)
        .neq("id", userId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingUser) {
        toast.error("Username is already taken");
        setIsLoading(false);
        return;
      }

      // Update the username
      const { data: updatedUser, error: updateError } = await supabase
        .from("User")
        .update({ name: username })
        .eq("id", userId)
        .select()
        .single();

      if (updateError) throw updateError;

      toast.success("Username updated successfully!");
      onUpdate(updatedUser.name);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating username:", error);
      toast.error("An error occurred while updating username");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <div
        className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsEditing(true)}
      >
        <span className="font-medium">{currentUsername}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation(); // Prevent the div's onClick from firing
            setIsEditing(true);
          }}
        >
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
        autoFocus // Focus the input when it appears
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
