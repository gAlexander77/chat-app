package routes

import (
	"database/sql"
	"log"
	"strconv"

	"github.com/galexander77/chat-app/api/db"
	"github.com/galexander77/chat-app/api/websocket"
	"github.com/gofiber/fiber/v2"
	fiberwebsocket "github.com/gofiber/websocket/v2"
)

// RegisterWebSocketRoutes registers WebSocket routes
func RegisterWebSocketRoutes(app *fiber.App, database *sql.DB) {
	userRepo := db.NewUserRepository(database)
	messageRepo := db.NewMessageRepository(database)

	// WebSocket middleware
	app.Use("/api/ws", func(c *fiber.Ctx) error {
		// IsWebSocketUpgrade returns true if the client requested upgrade to the WebSocket protocol
		if fiberwebsocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	// WebSocket route
	app.Get("/api/ws/:lobbyID", fiberwebsocket.New(func(c *fiberwebsocket.Conn) {
		// Get lobby ID from params
		lobbyID := c.Params("lobbyID")

		// Get user ID from query
		userID := c.Query("userID")
		if userID == "" {
			log.Println("User ID is required")
			return
		}

		// Convert IDs to integers
		lobbyIDInt, err := strconv.Atoi(lobbyID)
		if err != nil {
			log.Println("Invalid lobby ID")
			return
		}
		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			log.Println("Invalid user ID")
			return
		}

		// Get username
		username, err := userRepo.GetUsernameByID(userIDInt)
		if err != nil {
			log.Println("Error getting username:", err)
			return
		}

		// Handle WebSocket connection
		websocket.HandleFiberConnection(c, lobbyIDInt, userIDInt, username, messageRepo)
	}))
}
