package routes

import (
	"database/sql"

	"github.com/galexander77/chat-app/api/db"
	"github.com/galexander77/chat-app/api/models"
	"github.com/galexander77/chat-app/api/websocket"
	"github.com/gofiber/fiber/v2"
)

// RegisterLobbyRoutes registers lobby routes
func RegisterLobbyRoutes(app *fiber.App, database *sql.DB) {
	lobbyRepo := db.NewLobbyRepository(database)

	// Lobby group
	lobby := app.Group("/api/lobbies")

	// Routes
	lobby.Get("/", getLobbiesHandler(lobbyRepo))
	lobby.Post("/", createLobbyHandler(lobbyRepo))
}

// getLobbiesHandler handles getting all lobbies
func getLobbiesHandler(lobbyRepo *db.LobbyRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		lobbies, err := lobbyRepo.GetAllLobbies()
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, "Error fetching lobbies: "+err.Error())
		}

		return c.JSON(lobbies)
	}
}

// createLobbyHandler handles creating a new lobby
func createLobbyHandler(lobbyRepo *db.LobbyRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var lobby models.Lobby
		if err := c.BodyParser(&lobby); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
		}

		lobbyID, err := lobbyRepo.CreateLobby(lobby.Name)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, "Error creating lobby: "+err.Error())
		}

		// Initialize connections map for this lobby
		websocket.InitLobby(lobbyID)

		// Return success
		lobby.ID = lobbyID
		return c.Status(fiber.StatusCreated).JSON(lobby)
	}
}
