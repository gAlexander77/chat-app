package db

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/galexander77/chat-app/api/models"
)

// MessageRepository handles database operations for messages
type MessageRepository struct {
	DB *sql.DB
}

// NewMessageRepository creates a new MessageRepository
func NewMessageRepository(db *sql.DB) *MessageRepository {
	return &MessageRepository{DB: db}
}

// SaveMessage saves a message to the database
func (r *MessageRepository) SaveMessage(content string, userID, lobbyID int) (int, error) {
	var messageID int
	err := r.DB.QueryRow("INSERT INTO messages (content, user_id, lobby_id) VALUES ($1, $2, $3) RETURNING id",
		content, userID, lobbyID).Scan(&messageID)
	if err != nil {
		return 0, fmt.Errorf("error saving message: %w", err)
	}

	return messageID, nil
}

// GetMessagesByLobbyID gets all messages for a lobby
func (r *MessageRepository) GetMessagesByLobbyID(lobbyID int) ([]models.Message, error) {
	rows, err := r.DB.Query(`
		SELECT m.id, m.content, m.user_id, u.username, m.lobby_id, m.timestamp 
		FROM messages m
		JOIN users u ON m.user_id = u.id
		WHERE m.lobby_id = $1
		ORDER BY m.timestamp ASC
	`, lobbyID)
	if err != nil {
		return nil, fmt.Errorf("error fetching messages: %w", err)
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var msg models.Message
		var timestamp time.Time
		if err := rows.Scan(&msg.ID, &msg.Content, &msg.UserID, &msg.Username, &msg.LobbyID, &timestamp); err != nil {
			return nil, fmt.Errorf("error scanning message data: %w", err)
		}
		msg.Timestamp = timestamp
		messages = append(messages, msg)
	}

	return messages, nil
}
