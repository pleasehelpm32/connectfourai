// hooks/useUser.ts
"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabaseClient";

export function useUser() {
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing user ID
    const storedUserId = localStorage.getItem("connectFourUserId");

    const initUser = async () => {
      let currentId = storedUserId;

      // If no stored ID, create one and store it
      if (!currentId) {
        currentId = uuidv4();
        localStorage.setItem("connectFourUserId", currentId);
      }

      setUserId(currentId);

      // Fetch or create user from database using Supabase
      try {
        // First check if user exists
        const { data: existingUser, error: findError } = await supabase
          .from("User")
          .select("id, name")
          .eq("id", currentId)
          .maybeSingle();

        if (findError) throw findError;

        if (existingUser) {
          // User exists, use their data
          setUsername(existingUser.name);
        } else {
          // User doesn't exist, create them
          const defaultName = `Guest-${currentId.substring(0, 6)}`;

          const { data: newUser, error: createError } = await supabase
            .from("User")
            .insert({
              id: currentId,
              name: defaultName,
            })
            .select()
            .single();

          if (createError) throw createError;

          setUsername(newUser.name);
        }
      } catch (error) {
        console.error("Error fetching/creating user:", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
        }
        console.error(
          "Error stringified:",
          JSON.stringify(error, Object.getOwnPropertyNames(error))
        );
      } finally {
        setIsLoading(false);
      }
    };

    initUser();
  }, []);

  return { userId, username, isLoading, setUsername };
}
