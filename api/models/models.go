package models

import (
	"time"
)

// User represents a user in the system
type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Password string `json:"password,omitempty"`
}

// UserResponse represents the response after user creation or login
type UserResponse struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Message  string `json:"message"`
}

// Error represents an error response
type Error struct {
	Message string `json:"message"`
}

// LoginRequest represents a login request
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Lobby represents a chat lobby
type Lobby struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// LobbyRequest represents a request to create a lobby
type LobbyRequest struct {
	Name string `json:"name"`
}

// Message represents a chat message
type Message struct {
	ID        int       `json:"id"`
	Content   string    `json:"content"`
	UserID    int       `json:"user_id"`
	Username  string    `json:"username"`
	LobbyID   int       `json:"lobby_id"`
	Timestamp time.Time `json:"timestamp"`
}

// MessageRequest represents a request to send a message
type MessageRequest struct {
	Content string `json:"content"`
}
