"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/lib/protected-route";
import { lobbiesApi, Lobby, Message } from "@/lib/api";
import { webSocketClient } from "@/lib/websocket";

export default function LobbyPage() {
  const params = useParams();
  const lobbyId = parseInt(params.id as string, 10);
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentLobby, setCurrentLobby] = useState<Lobby | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch lobby details
  useEffect(() => {
    const fetchLobbyData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch lobby details
        const lobby = await lobbiesApi.getLobby(lobbyId);
        setCurrentLobby(lobby);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lobby data");
        console.error("Error loading lobby data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isNaN(lobbyId)) {
      fetchLobbyData();
    }
  }, [lobbyId]);

  // Set up WebSocket connection
  useEffect(() => {
    if (isNaN(lobbyId) || !user || !user.id || isLoading || !currentLobby) return;

    // Connect to WebSocket
    const connectWebSocket = async () => {
      try {
        await webSocketClient.connect(lobbyId, user.id);
        setWsConnected(true);
      } catch (err) {
        console.error("WebSocket connection error:", err);
        setError("Failed to connect to chat server. Messages may be delayed.");
      }
    };

    connectWebSocket();

    // Set up WebSocket event handlers
    const messageUnsubscribe = webSocketClient.onMessage((message) => {
      console.log("Received message:", message);
      setMessages((prevMessages) => {
        // Check if message already exists
        const exists = prevMessages.some(m => m.id === message.id);
        if (exists) return prevMessages;
        return [...prevMessages, message];
      });
    });

    const userJoinedUnsubscribe = webSocketClient.onUserJoined((username) => {
      console.log("User joined:", username);
      setParticipants((prev) => {
        if (prev.includes(username)) return prev;
        return [...prev, username];
      });
    });

    const userLeftUnsubscribe = webSocketClient.onUserLeft((username) => {
      console.log("User left:", username);
      setParticipants((prev) => prev.filter(name => name !== username));
    });

    const errorUnsubscribe = webSocketClient.onError((errorMessage) => {
      console.error("WebSocket error:", errorMessage);
      setError(errorMessage);
    });

    // Clean up WebSocket connection and event handlers
    return () => {
      messageUnsubscribe();
      userJoinedUnsubscribe();
      userLeftUnsubscribe();
      errorUnsubscribe();
      webSocketClient.disconnect();
      setWsConnected(false);
    };
  }, [lobbyId, user, isLoading, currentLobby]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !user.id) return;

    setIsSending(true);
    
    try {
      if (wsConnected) {
        // Send message via WebSocket for real-time delivery
        webSocketClient.sendMessage(newMessage);
        setNewMessage("");
      } else {
        setError("Not connected to chat server. Please try again later.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = () => {
    webSocketClient.disconnect();
    logout();
    router.push("/");
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <p>Loading lobby...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!currentLobby) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Lobby not found</h1>
            <p className="text-red-600 mb-4">{error}</p>
            <Link href="/lobbies" className="text-blue-600 hover:underline">
              Return to lobbies
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!user || !user.id) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
            <p className="text-red-600 mb-4">User information is incomplete. Please log in again.</p>
            <button
              onClick={handleLogout}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Return to Login
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col">
        {/* Header */}
        <header className="border-b bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{currentLobby.name}</h1>
              <div className="flex items-center text-sm text-gray-500">
                <div className={`mr-2 h-2 w-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{wsConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="text-sm text-gray-600">
                  Logged in as <span className="font-semibold">{user.username}</span>
                </div>
              )}
              <div className="flex gap-2">
                <Link
                  href="/lobbies"
                  className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                >
                  Back to Lobbies
                </Link>
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

        {/* Error message */}
        {error && (
          <div className="m-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="text-sm text-red-700">
                {error}
              </div>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-500"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No messages yet. Be the first to send a message!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.username === user?.username ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.username === user?.username
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-semibold">{message.username}</span>
                      <span className="ml-2 text-xs opacity-75">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p>{message.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message input */}
        <div className="border-t bg-white p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              disabled={isSending || !wsConnected}
            />
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-400"
              disabled={isSending || !newMessage.trim() || !wsConnected}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </form>
          {!wsConnected && (
            <p className="mt-2 text-center text-sm text-red-500">
              Not connected to chat server. Please refresh the page to try again.
            </p>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 