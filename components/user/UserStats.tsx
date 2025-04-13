// components/user/UserStats.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import { getUserStats } from "@/app/actions/userActions";
import { Skeleton } from "@/components/ui/skeleton";

interface UserStatsProps {
  userId: string;
}

interface Stats {
  wins: number;
  losses: number;
  ties: number;
  gamesPlayed: number;
  winPercentage: number;
  topOpponentWins: { name: string; count: number }[];
  topOpponentLosses: { name: string; count: number }[];
}

export default function UserStats({ userId }: UserStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await getUserStats(userId);

        if (result.success) {
          setStats(result.stats || null);
        } else {
          setError(result.message || "Failed to load stats");
        }
      } catch (error) {
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        No stats available yet. Play some games!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Overall Stats</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="bg-white dark:bg-gray-700 p-3 rounded-md text-center">
            <div className="text-xl font-bold">{stats.gamesPlayed}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Games
            </div>
          </div>
          <div className="bg-white dark:bg-gray-700 p-3 rounded-md text-center">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {stats.wins}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Wins</div>
          </div>
          <div className="bg-white dark:bg-gray-700 p-3 rounded-md text-center">
            <div className="text-xl font-bold text-red-600 dark:text-red-400">
              {stats.losses}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Losses
            </div>
          </div>
          <div className="bg-white dark:bg-gray-700 p-3 rounded-md text-center">
            <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.ties}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Ties</div>
          </div>
        </div>
        <div className="mt-3 text-center">
          <div className="text-sm font-medium">
            Win Rate: <span className="font-bold">{stats.winPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Top Opponents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Most Wins Against */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Most Wins Against</h3>
          {stats.topOpponentWins.length > 0 ? (
            <ul className="space-y-2">
              {stats.topOpponentWins.map((opponent, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center bg-white dark:bg-gray-700 p-2 rounded"
                >
                  <span>{opponent.name}</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {opponent.count} wins
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No wins recorded yet
            </p>
          )}
        </div>

        {/* Most Losses Against */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Most Losses Against</h3>
          {stats.topOpponentLosses.length > 0 ? (
            <ul className="space-y-2">
              {stats.topOpponentLosses.map((opponent, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center bg-white dark:bg-gray-700 p-2 rounded"
                >
                  <span>{opponent.name}</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {opponent.count} losses
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No losses recorded yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
