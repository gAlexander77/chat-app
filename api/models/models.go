package models

import (
	"time"
)

// User represents a user in the system
type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Password string `json:"-"` // Don't send password in JSON responses
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

// Lobby represents a chat lobby
type Lobby struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// LoginRequest represents login credentials
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// MessageRequest represents a message sent by a client
type MessageRequest struct {
	Content string `json:"content"`
}
