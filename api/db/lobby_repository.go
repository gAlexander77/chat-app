package db

import (
	"database/sql"
	"fmt"

	"github.com/galexander77/chat-app/api/models"
)

// LobbyRepository handles database operations for lobbies
type LobbyRepository struct {
	DB *sql.DB
}

// NewLobbyRepository creates a new LobbyRepository
func NewLobbyRepository(db *sql.DB) *LobbyRepository {
	return &LobbyRepository{DB: db}
}

// GetAllLobbies gets all lobbies from the database
func (r *LobbyRepository) GetAllLobbies() ([]models.Lobby, error) {
	rows, err := r.DB.Query("SELECT id, name FROM lobbies")
	if err != nil {
		return nil, fmt.Errorf("error fetching lobbies: %w", err)
	}
	defer rows.Close()

	var lobbies []models.Lobby
	for rows.Next() {
		var lobby models.Lobby
		if err := rows.Scan(&lobby.ID, &lobby.Name); err != nil {
			return nil, fmt.Errorf("error scanning lobby data: %w", err)
		}
		lobbies = append(lobbies, lobby)
	}

	return lobbies, nil
}

// CreateLobby creates a new lobby in the database
func (r *LobbyRepository) CreateLobby(name string) (int, error) {
	var lobbyID int
	err := r.DB.QueryRow("INSERT INTO lobbies (name) VALUES ($1) RETURNING id", name).Scan(&lobbyID)
	if err != nil {
		return 0, fmt.Errorf("error creating lobby: %w", err)
	}

	return lobbyID, nil
}
