// hooks/useUser.ts
"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid"; // You'll need to install uuid
import { createOrGetUser } from "@/app/actions/userActions";

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

      // Fetch or create user from database
      try {
        const userResult = await createOrGetUser(currentId);
        if (userResult.success) {
          setUsername(userResult.name || "Guest");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initUser();
  }, []);

  return { userId, username, isLoading, setUsername };
}
