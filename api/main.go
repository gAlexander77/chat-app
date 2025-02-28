package main

import (
	"log"

	"github.com/galexander77/chat-app/api/config"
	"github.com/galexander77/chat-app/api/db"
	"github.com/galexander77/chat-app/api/routes"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Initialize database
	database, err := db.InitDB(cfg.Database)
	if err != nil {
		log.Fatal("Error initializing database:", err)
	}
	defer database.Close()

	// Create tables if they don't exist
	if err := db.CreateTables(database); err != nil {
		log.Fatal("Error creating tables:", err)
	}

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			// Default 500 statuscode
			code := fiber.StatusInternalServerError

			if e, ok := err.(*fiber.Error); ok {
				// Override status code if fiber.Error type
				code = e.Code
			}

			// Set Content-Type: text/plain; charset=utf-8
			c.Set(fiber.HeaderContentType, fiber.MIMETextPlainCharsetUTF8)

			// Return statuscode with error message
			return c.Status(code).SendString(err.Error())
		},
	})

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New())

	// Register routes
	routes.RegisterAuthRoutes(app, database)
	routes.RegisterLobbyRoutes(app, database)
	routes.RegisterWebSocketRoutes(app, database)

	// Start server
	log.Printf("Server starting on port %s\n", cfg.Server.Port)
	log.Fatal(app.Listen(":" + cfg.Server.Port))
}
