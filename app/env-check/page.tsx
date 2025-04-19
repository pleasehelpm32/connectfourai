// app/env-check/page.tsx
"use client";

import { useEffect, useState } from "react";

export default function EnvCheck() {
  const [envVars, setEnvVars] = useState({
    supabaseUrl: "",
    hasAnonKey: false,
  });

  useEffect(() => {
    // Only show the first part of the URL for security
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    setEnvVars({
      supabaseUrl: url.substring(0, 12) + "...",
      hasAnonKey: hasKey,
    });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Environment Variables Check</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(envVars, null, 2)}
      </pre>
    </div>
  );
}
