"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/lib/protected-route";
import { lobbiesApi, Lobby, CreateLobbyRequest } from "@/lib/api";

export default function LobbiesPage() {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [newLobbyName, setNewLobbyName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  // Fetch lobbies on component mount
  useEffect(() => {
    const fetchLobbies = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await lobbiesApi.getLobbies();
        setLobbies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lobbies");
        console.error("Error loading lobbies:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLobbies();
  }, []);

  // Handle creating a new lobby
  const handleCreateLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newLobbyName.trim()) return;
    
    setIsCreating(true);
    setError(null);
    
    try {
      const lobbyData: CreateLobbyRequest = { name: newLobbyName };
      const newLobby = await lobbiesApi.createLobby(lobbyData);
      
      // Add the new lobby to the list
      setLobbies((prevLobbies) => [...prevLobbies, newLobby]);
      setNewLobbyName("");
      
      // Navigate to the new lobby
      router.push(`/lobby/${newLobby.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lobby");
      console.error("Error creating lobby:", err);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to logout");
      console.error("Error logging out:", err);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Lobbies</h1>
              <div className="flex items-center gap-4">
                {user && (
                  <div className="text-sm text-gray-600">
                    Logged in as <span className="font-semibold">{user.username}</span>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Error message */}
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Create lobby form */}
          <div className="mb-8 rounded-md bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Create a New Lobby</h2>
            <form onSubmit={handleCreateLobby} className="flex gap-4">
              <input
                type="text"
                value={newLobbyName}
                onChange={(e) => setNewLobbyName(e.target.value)}
                placeholder="Enter lobby name"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                disabled={isCreating}
              />
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-400"
                disabled={isCreating || !newLobbyName.trim()}
              >
                {isCreating ? "Creating..." : "Create Lobby"}
              </button>
            </form>
          </div>

          {/* Lobbies list */}
          <div className="rounded-md bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Available Lobbies</h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                <span className="ml-2">Loading lobbies...</span>
              </div>
            ) : lobbies.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <p>No lobbies available. Create one to get started!</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {lobbies.map((lobby) => (
                  <li key={lobby.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{lobby.name}</h3>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(lobby.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Link
                        href={`/lobby/${lobby.id}`}
                        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                      >
                        Join
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 