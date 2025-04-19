// app/supatest/page.tsx - Simplified version
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function SupaTest() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);

  useEffect(() => {
    // Log environment variables (just checking if they're defined, not their values)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    setConnectionInfo({
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlFirstChars: supabaseUrl.substring(0, 8) + "...",
    });

    const testConnection = async () => {
      try {
        // Create a fresh client
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Try the simplest possible query
        const { data, error: queryError } = await supabase
          .from("User")
          .select("id")
          .limit(1);

        if (queryError) {
          setError(queryError);
        } else {
          setResult({ data, message: "Successfully connected!" });
        }
      } catch (e) {
        setError(e);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Supabase Connection Test</h1>

      <div className="mb-4">
        <h2 className="text-xl">Environment Check:</h2>
        <pre className="bg-gray-100 p-2">
          {JSON.stringify(connectionInfo, null, 2)}
        </pre>
      </div>

      {result && (
        <div className="mb-4">
          <h2 className="text-xl">Success:</h2>
          <pre className="bg-green-100 p-2">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div>
          <h2 className="text-xl">Error:</h2>
          <pre className="bg-red-100 p-2">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
