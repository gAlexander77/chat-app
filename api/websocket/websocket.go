package websocket

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/galexander77/chat-app/api/db"
	"github.com/galexander77/chat-app/api/models"
	"github.com/gofiber/websocket/v2"
)

// Map to store active connections per lobby
var (
	lobbies = make(map[int]map[*websocket.Conn]bool)
	mutex   = &sync.Mutex{}
)

// InitLobby initializes a lobby's connection map
func InitLobby(lobbyID int) {
	mutex.Lock()
	defer mutex.Unlock()

	if _, ok := lobbies[lobbyID]; !ok {
		lobbies[lobbyID] = make(map[*websocket.Conn]bool)
	}
}

// HandleFiberConnection handles a WebSocket connection with Fiber
func HandleFiberConnection(conn *websocket.Conn, lobbyID, userID int, username string, messageRepo *db.MessageRepository) {
	// Add connection to lobby
	mutex.Lock()
	if _, ok := lobbies[lobbyID]; !ok {
		lobbies[lobbyID] = make(map[*websocket.Conn]bool)
	}
	lobbies[lobbyID][conn] = true
	mutex.Unlock()

	// Remove connection when done
	defer func() {
		mutex.Lock()
		delete(lobbies[lobbyID], conn)
		mutex.Unlock()
	}()

	// Send join message to all clients in lobby
	joinMsg := models.Message{
		Content:   username + " has joined the lobby",
		UserID:    0, // System message
		Username:  "System",
		LobbyID:   lobbyID,
		Timestamp: time.Now(),
	}
	broadcastToLobby(lobbyID, joinMsg)

	// Handle incoming messages
	for {
		// Read message from WebSocket
		messageType, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			break
		}

		// Only handle text messages
		if messageType != websocket.TextMessage {
			continue
		}

		// Parse message
		var msgContent models.MessageRequest
		if err := json.Unmarshal(msg, &msgContent); err != nil {
			log.Println("Error parsing message:", err)
			continue
		}

		// Create message
		message := models.Message{
			Content:   msgContent.Content,
			UserID:    userID,
			Username:  username,
			LobbyID:   lobbyID,
			Timestamp: time.Now(),
		}

		// Save message to database
		messageID, err := messageRepo.SaveMessage(message.Content, message.UserID, message.LobbyID)
		if err != nil {
			log.Println("Error saving message:", err)
			continue
		}
		message.ID = messageID

		// Broadcast message to all clients in lobby
		broadcastToLobby(lobbyID, message)
	}
}

// broadcastToLobby broadcasts a message to all clients in a lobby
func broadcastToLobby(lobbyID int, msg models.Message) {
	// Convert message to JSON
	msgJSON, err := json.Marshal(msg)
	if err != nil {
		log.Println("Error marshaling message:", err)
		return
	}

	// Send message to all clients in lobby
	mutex.Lock()
	defer mutex.Unlock()

	for conn := range lobbies[lobbyID] {
		if err := conn.WriteMessage(websocket.TextMessage, msgJSON); err != nil {
			log.Println("Error sending message:", err)
			conn.Close()
			delete(lobbies[lobbyID], conn)
		}
	}
}
