# Chat Application with WebSockets

A real-time chat application built with Go Fiber, WebSockets, and PostgreSQL.

## Features

- User authentication (signup/login)
- Multiple chat lobbies
- Real-time messaging using WebSockets
- Message persistence in PostgreSQL database

## Project Structure 

api/
├── config/           # Application configuration
├── db/               # Database connection and repositories
├── models/           # Data models
├── routes/           # HTTP route handlers
├── websocket/        # WebSocket handling
├── go.mod            # Go module file
└── main.go           # Application entry point

## Setup and Installation

### 1. Start the PostgreSQL database

```bash
docker-compose up -d
```

This will start a PostgreSQL instance with the following configuration:
- Username: postgres
- Password: postgres
- Database: chatapp
- Port: 5432

### 2. Build and run the Go application

```bash
cd api
go mod tidy
go run main.go
```

The server will start on port 8080.

## API Endpoints

### Authentication

- **Signup**: `POST /api/signup`
- **Login**: `POST /api/login`

### Lobbies

- **Create Lobby**: `POST /api/lobbies`
- **Get All Lobbies**: `GET /api/lobbies`

### WebSocket Connection

Connect to a lobby's WebSocket:
```
ws://localhost:8080/api/ws/{lobbyID}?userID={userID}
```

Replace `{lobbyID}` with the ID of the lobby and `{userID}` with your user ID.