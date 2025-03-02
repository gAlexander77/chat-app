# Real-Time Chat Application

A full-stack real-time chat application built with Go (backend) and Next.js (frontend). This application allows users to create accounts, join chat lobbies, and exchange messages in real-time using WebSockets.

## Features

- **User Authentication**: Sign up and login functionality
- **Chat Lobbies**: Create and join multiple chat rooms
- **Real-Time Messaging**: Instant message delivery using WebSockets
- **Responsive UI**: Modern interface built with Next.js and Tailwind CSS
- **Message Persistence**: All messages are stored in a PostgreSQL database

## Project Structure

The project is divided into two main parts:

### Backend (`/api`)

```
api/
├── config/           # Application configuration
├── db/               # Database connection and repositories
├── models/           # Data models
├── routes/           # HTTP route handlers
├── websocket/        # WebSocket handling
├── docs/             # API documentation
├── go.mod            # Go module file
├── go.sum            # Go module dependencies
├── main.go           # Application entry point
├── openapi.yaml      # OpenAPI specification
└── docker-compose.yml # Docker configuration for PostgreSQL
```

### Frontend (`/application`)

```
application/
├── app/              # Next.js app directory
│   ├── (auth)/       # Authentication routes (login, signup)
│   ├── lobbies/      # Lobbies listing page
│   ├── lobby/        # Individual lobby chat page
│   └── page.tsx      # Home page
├── lib/              # Utility libraries
│   ├── api.ts        # API client
│   ├── auth-context.tsx # Authentication context
│   ├── protected-route.tsx # Route protection component
│   ├── websocket.ts  # WebSocket client
│   └── utils.ts      # Utility functions
├── public/           # Static assets
└── package.json      # Node.js dependencies
```

## Prerequisites

- Node.js (v18 or later)
- Go (v1.20 or later)
- Docker and Docker Compose (for PostgreSQL)

## Setup and Installation

### 1. Backend Setup

1. Start the PostgreSQL database:
   ```bash
   cd api
   docker-compose up -d
   ```

2. Build and run the Go application:
   ```bash
   cd api
   go mod tidy
   go run main.go
   ```

   The backend server will start on port 8080.

### 2. Frontend Setup

1. Install dependencies:
   ```bash
   cd application
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

   The frontend application will be available at http://localhost:3000.

## API Endpoints

### Authentication

- **Signup**: `POST /api/signup`
  - Request body: `{ "username": "string", "password": "string" }`

- **Login**: `POST /api/login`
  - Request body: `{ "username": "string", "password": "string" }`

### Lobbies

- **Create Lobby**: `POST /api/lobbies`
  - Request body: `{ "name": "string" }`

- **Get All Lobbies**: `GET /api/lobbies`

### WebSocket Connection

Connect to a lobby's WebSocket:
```
ws://localhost:8080/api/ws/{lobbyID}?userID={userID}
```

Replace `{lobbyID}` with the ID of the lobby and `{userID}` with your user ID.

## Usage

1. Register a new account or log in with existing credentials
2. Browse available lobbies or create a new one
3. Join a lobby to start chatting in real-time
4. Messages will be delivered instantly to all users in the same lobby

## WebSocket Message Format

When sending a message through WebSocket:
```json
{
  "content": "Your message text here"
}
```

## Technologies Used

### Backend
- Go Fiber (web framework)
- Fiber WebSocket (WebSocket implementation)
- PostgreSQL (database)
- Docker (containerization)

### Frontend
- Next.js (React framework)
- TypeScript
- Tailwind CSS (styling)
- WebSocket API (real-time communication)

## License

[MIT License](LICENSE) 