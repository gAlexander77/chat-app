"use client";

import { Message } from './api';

// WebSocket URL
const WS_URL = 'ws://localhost:8080/api/ws';

// WebSocket client class
export class WebSocketClient {
  private socket: WebSocket | null = null;
  private lobbyId: number | null = null;
  private userId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  // Event listeners
  private messageListeners: ((message: Message) => void)[] = [];
  private userJoinedListeners: ((username: string) => void)[] = [];
  private userLeftListeners: ((username: string) => void)[] = [];
  private errorListeners: ((error: string) => void)[] = [];

  // Connect to WebSocket server
  async connect(lobbyId: number, userId: number): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.lobbyId = lobbyId;
    this.userId = userId;

    return new Promise((resolve, reject) => {
      try {
        // Create WebSocket connection with lobby ID and user ID
        // The server expects userID (uppercase ID), not userId
        this.socket = new WebSocket(`${WS_URL}/${lobbyId}?userID=${userId}`);

        this.socket.onopen = () => {
          console.log(`WebSocket connected to lobby ${lobbyId} with user ID ${userId}`);
          this.reconnectAttempts = 0;
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            console.log("Raw WebSocket message:", event.data);
            const message = JSON.parse(event.data);
            
            // The server sends Message objects directly, not wrapped in a type/data structure
            if (message.user_id === 0 && message.username === "System") {
              // This is a system message about a user joining or leaving
              if (message.content.includes("has joined")) {
                const username = message.content.split(" has joined")[0];
                this.notifyUserJoinedListeners(username);
              } else if (message.content.includes("has left")) {
                const username = message.content.split(" has left")[0];
                this.notifyUserLeftListeners(username);
              }
            } else {
              // Regular chat message
              const formattedMessage: Message = {
                id: message.id,
                content: message.content,
                user_id: message.user_id,
                username: message.username,
                lobby_id: message.lobby_id,
                timestamp: message.timestamp // Keep as string to match the Message interface
              };
              this.notifyMessageListeners(formattedMessage);
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.notifyErrorListeners('WebSocket connection error');
          reject(error);
        };

        this.socket.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          
          // Attempt to reconnect if not closed cleanly and max attempts not reached
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          } else {
            this.notifyErrorListeners('WebSocket connection closed');
          }
        };
      } catch (err) {
        console.error('Error creating WebSocket:', err);
        reject(err);
      }
    });
  }

  // Attempt to reconnect with exponential backoff
  private attemptReconnect() {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      if (this.lobbyId && this.userId) {
        this.connect(this.lobbyId, this.userId).catch(err => {
          console.error('Reconnection failed:', err);
        });
      }
    }, delay);
  }

  // Send a message to the server
  sendMessage(content: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    // The server expects a MessageRequest with just the content field
    const message = {
      content: content
    };

    console.log("Sending message:", message);
    this.socket.send(JSON.stringify(message));
  }

  // Disconnect from the WebSocket server
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.lobbyId = null;
    this.userId = null;
    this.reconnectAttempts = 0;
  }

  // Event listener registration methods
  onMessage(callback: (message: Message) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(cb => cb !== callback);
    };
  }

  onUserJoined(callback: (username: string) => void): () => void {
    this.userJoinedListeners.push(callback);
    return () => {
      this.userJoinedListeners = this.userJoinedListeners.filter(cb => cb !== callback);
    };
  }

  onUserLeft(callback: (username: string) => void): () => void {
    this.userLeftListeners.push(callback);
    return () => {
      this.userLeftListeners = this.userLeftListeners.filter(cb => cb !== callback);
    };
  }

  onError(callback: (error: string) => void): () => void {
    this.errorListeners.push(callback);
    return () => {
      this.errorListeners = this.errorListeners.filter(cb => cb !== callback);
    };
  }

  // Notify listeners
  private notifyMessageListeners(message: Message): void {
    this.messageListeners.forEach(listener => listener(message));
  }

  private notifyUserJoinedListeners(username: string): void {
    this.userJoinedListeners.forEach(listener => listener(username));
  }

  private notifyUserLeftListeners(username: string): void {
    this.userLeftListeners.forEach(listener => listener(username));
  }

  private notifyErrorListeners(error: string): void {
    this.errorListeners.forEach(listener => listener(error));
  }
}

// Create a singleton instance
export const webSocketClient = new WebSocketClient(); 