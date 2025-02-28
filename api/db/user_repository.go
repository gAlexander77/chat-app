package db

import (
	"database/sql"
	"encoding/base64"
	"fmt"
	"log"

	"github.com/galexander77/chat-app/api/models"
	"golang.org/x/crypto/bcrypt"
)

// UserRepository handles database operations for users
type UserRepository struct {
	DB *sql.DB
}

// NewUserRepository creates a new UserRepository
func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{DB: db}
}

// CreateUser creates a new user in the database
func (r *UserRepository) CreateUser(username, password string) (int, error) {
	// Log password length for debugging
	log.Printf("Creating user with password length: %d", len(password))

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return 0, fmt.Errorf("error hashing password: %w", err)
	}

	// Log hash length for debugging
	log.Printf("Generated hash length: %d", len(hashedPassword))

	// Base64 encode the hash for storage
	encodedHash := base64.StdEncoding.EncodeToString(hashedPassword)
	log.Printf("Encoded hash: %s", encodedHash)

	// Insert user into database
	var userID int
	err = r.DB.QueryRow("INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
		username, encodedHash).Scan(&userID)
	if err != nil {
		return 0, fmt.Errorf("error creating user: %w", err)
	}

	return userID, nil
}

// GetUserByUsername gets a user by username
func (r *UserRepository) GetUserByUsername(username string) (*models.User, string, error) {
	var user models.User
	var encodedHash string
	err := r.DB.QueryRow("SELECT id, username, password FROM users WHERE username = $1",
		username).Scan(&user.ID, &user.Username, &encodedHash)
	if err != nil {
		return nil, "", fmt.Errorf("error getting user: %w", err)
	}

	// Log retrieved hash length for debugging
	log.Printf("Retrieved encoded hash from DB: %s", encodedHash)

	// Decode the hash
	hashedPassword, err := base64.StdEncoding.DecodeString(encodedHash)
	if err != nil {
		return nil, "", fmt.Errorf("error decoding hash: %w", err)
	}

	log.Printf("Decoded hash length: %d", len(hashedPassword))

	return &user, string(hashedPassword), nil
}

// GetUsernameByID gets a username by user ID
func (r *UserRepository) GetUsernameByID(userID int) (string, error) {
	var username string
	err := r.DB.QueryRow("SELECT username FROM users WHERE id = $1", userID).Scan(&username)
	if err != nil {
		return "", fmt.Errorf("error getting username: %w", err)
	}

	return username, nil
}
