// API client for the chat application

// API base URL
const API_URL = 'http://localhost:8080/api';

// User interface
export interface User {
  id: number;
  username: string;
  message?: string;
}

// Lobby interface
export interface Lobby {
  id: number;
  name: string;
  created_at: string;
  owner_id: number;
}

// Message interface
export interface Message {
  id: number;
  lobby_id: number;
  user_id: number;
  username: string;
  content: string;
  timestamp: string;
}

// Login request interface
export interface LoginRequest {
  username: string;
  password: string;
}

// Register request interface
export interface RegisterRequest {
  username: string;
  password: string;
}

// Create lobby request interface
export interface CreateLobbyRequest {
  name: string;
}

// API client class
class ApiClient {
  // Authentication methods
  async login(data: LoginRequest): Promise<User> {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    return response.json();
  }

  async register(data: RegisterRequest): Promise<User> {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    return response.json();
  }

  async logout(): Promise<void> {
    // Since there's no explicit logout endpoint in the OpenAPI spec,
    // we'll just clear the client-side session
    // In a real app, you would call a server endpoint to invalidate the session
    console.log('Logging out (client-side only)');
  }

  async getCurrentUser(): Promise<User> {
    // Since there's no /me endpoint in the OpenAPI spec,
    // we'll rely on the client-side session
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      throw new Error('Not authenticated');
    }
    
    try {
      return JSON.parse(storedUser);
    } catch (err) {
      throw new Error('Invalid user data');
    }
  }

  // Lobby methods
  async getLobbies(): Promise<Lobby[]> {
    const response = await fetch(`${API_URL}/lobbies`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch lobbies');
    }

    return response.json();
  }

  async getLobby(id: number): Promise<Lobby> {
    // Fetch all lobbies and find the one with the matching ID
    const lobbies = await this.getLobbies();
    const lobby = lobbies.find(lobby => lobby.id === id);
    
    if (!lobby) {
      throw new Error(`Lobby with ID ${id} not found`);
    }
    
    return lobby;
  }

  async createLobby(data: CreateLobbyRequest): Promise<Lobby> {
    const response = await fetch(`${API_URL}/lobbies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create lobby');
    }

    return response.json();
  }

  // Message methods - these are handled via WebSocket
  async getLobbyMessages(lobbyId: number): Promise<Message[]> {
    // Messages are handled via WebSocket, not REST API
    console.warn('Messages are handled via WebSocket, not REST API');
    return [];
  }

  async sendMessage(lobbyId: number, content: string): Promise<Message> {
    // Messages are sent via WebSocket, not REST API
    throw new Error('Messages should be sent via WebSocket, not REST API');
  }
}

// Create a singleton instance
export const api = new ApiClient();

// Export a lobbies API for convenience
export const lobbiesApi = {
  getLobbies: () => api.getLobbies(),
  getLobby: (id: number) => api.getLobby(id),
  createLobby: (data: CreateLobbyRequest) => api.createLobby(data),
  getLobbyMessages: (lobbyId: number) => api.getLobbyMessages(lobbyId),
}; 