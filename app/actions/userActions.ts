// app/actions/userActions.ts
"use server";

import { db } from "@/lib/db";

export async function createOrGetUser(userId: string) {
  try {
    // Try to find existing user
    let user = await db.user.findUnique({
      where: { id: userId },
    });

    // If user doesn't exist, create with default Guest name
    if (!user) {
      user = await db.user.create({
        data: {
          id: userId,
          name: `Guest-${userId.substring(0, 6)}`, // Default name with unique suffix
        },
      });
    }

    return { success: true, name: user.name, id: user.id };
  } catch (error) {
    console.error("Error in createOrGetUser:", error);
    return { success: false, message: "Failed to get or create user" };
  }
}

export async function updateUsername(userId: string, newName: string) {
  // Validate username (3-20 chars, alphanumeric + underscore)
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(newName)) {
    return {
      success: false,
      message:
        "Username must be 3-20 characters and contain only letters, numbers, and underscores. No spaces or special characters allowed.",
    };
  }

  try {
    // Check if name is already taken
    const existingUser = await db.user.findFirst({
      where: {
        name: newName,
        id: { not: userId }, // Don't check against self
      },
    });

    if (existingUser) {
      return { success: false, message: "Username is already taken" };
    }

    // Update user name
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { name: newName },
    });

    return { success: true, name: updatedUser.name };
  } catch (error) {
    console.error("Error updating username:", error);
    return { success: false, message: "Failed to update username" };
  }
}

export async function getUserStats(userId: string) {
  try {
    // Get user with games
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        gamesAsRed: {
          where: { status: "COMPLETED" },
          select: {
            id: true,
            winner: true,
            isTie: true,
            bluePlayer: { select: { name: true } },
          },
        },
        gamesAsBlue: {
          where: { status: "COMPLETED" },
          select: {
            id: true,
            winner: true,
            isTie: true,
            redPlayer: { select: { name: true } },
          },
        },
      },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Calculate stats
    let wins = 0;
    let losses = 0;
    let ties = 0;

    // Track opponents for most wins/losses against
    const opponentWins: Record<string, number> = {};
    const opponentLosses: Record<string, number> = {};

    // Process red games
    user.gamesAsRed.forEach((game) => {
      const opponentName = game.bluePlayer?.name || "Unknown";

      if (game.isTie) {
        ties++;
      } else if (game.winner === "RED") {
        wins++;
        opponentWins[opponentName] = (opponentWins[opponentName] || 0) + 1;
      } else if (game.winner === "BLUE") {
        losses++;
        opponentLosses[opponentName] = (opponentLosses[opponentName] || 0) + 1;
      }
    });

    // Process blue games
    user.gamesAsBlue.forEach((game) => {
      const opponentName = game.redPlayer?.name || "Unknown";

      if (game.isTie) {
        ties++;
      } else if (game.winner === "BLUE") {
        wins++;
        opponentWins[opponentName] = (opponentWins[opponentName] || 0) + 1;
      } else if (game.winner === "RED") {
        losses++;
        opponentLosses[opponentName] = (opponentLosses[opponentName] || 0) + 1;
      }
    });

    // Sort opponents by wins/losses
    const topOpponentWins = Object.entries(opponentWins)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const topOpponentLosses = Object.entries(opponentLosses)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      success: true,
      stats: {
        wins,
        losses,
        ties,
        gamesPlayed: wins + losses + ties,
        winPercentage:
          wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0,
        topOpponentWins,
        topOpponentLosses,
      },
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return { success: false, message: "Failed to fetch stats" };
  }
}
