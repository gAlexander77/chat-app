"use client";

import { Message } from './api';

// WebSocket URL
const WS_URL = 'ws://localhost:8080/api/ws';

// WebSocket message types
type WebSocketMessage = {
  type: 'message' | 'user_joined' | 'user_left' | 'error';
  data: any;
};

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
            const data = JSON.parse(event.data);
            this.handleMessage(data);
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

  // Handle incoming WebSocket messages
  private handleMessage(data: WebSocketMessage) {
    switch (data.type) {
      case 'message':
        // Handle chat message
        const message = data.data as Message;
        this.notifyMessageListeners(message);
        break;
      case 'user_joined':
        // Handle user joined event
        const joinedUsername = data.data.username;
        this.notifyUserJoinedListeners(joinedUsername);
        break;
      case 'user_left':
        // Handle user left event
        const leftUsername = data.data.username;
        this.notifyUserLeftListeners(leftUsername);
        break;
      case 'error':
        // Handle error message
        const errorMessage = data.data.message;
        this.notifyErrorListeners(errorMessage);
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
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

    const message = {
      type: 'message',
      content: content
    };

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