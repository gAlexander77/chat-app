package db

import (
	"database/sql"
	"fmt"

	"github.com/galexander77/chat-app/api/config"
	_ "github.com/lib/pq"
)

// InitDB initializes the database connection
func InitDB(cfg config.DatabaseConfig) (*sql.DB, error) {
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}

// CreateTables creates the necessary tables if they don't exist
func CreateTables(db *sql.DB) error {
	// Create users table
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			username VARCHAR(50) UNIQUE NOT NULL,
			password VARCHAR(100) NOT NULL
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating users table: %w", err)
	}

	// Create lobbies table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS lobbies (
			id SERIAL PRIMARY KEY,
			name VARCHAR(50) UNIQUE NOT NULL
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating lobbies table: %w", err)
	}

	// Create messages table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS messages (
			id SERIAL PRIMARY KEY,
			content TEXT NOT NULL,
			user_id INTEGER REFERENCES users(id),
			lobby_id INTEGER REFERENCES lobbies(id),
			timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating messages table: %w", err)
	}

	return nil
}
