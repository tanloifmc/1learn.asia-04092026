"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { redeemParentInvitation } from "@/features/parent/actions";

export function RedeemTokenForm({ parentId }: { parentId: string }) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await redeemParentInvitation(token.trim(), parentId);
      
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/parent/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="token" className="block text-sm font-medium text-gray-700">
          Invitation Token
        </label>
        <div className="mt-1">
          <input
            id="token"
            name="token"
            type="text"
            required
            value={token}
            onChange={(e) => setToken(e.target.value.toUpperCase())}
            placeholder="e.g. A1B2C3D4"
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono tracking-widest uppercase"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Connection Failed</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={loading || token.length < 6}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? "Linking..." : "Link Account"}
        </button>
      </div>
    </form>
  );
}
