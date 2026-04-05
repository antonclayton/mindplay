# Mindplay

CS160 Sec02 Project - A web-based game with user authentication.

## Tech Stack

**Frontend:**
- React + Vite
- Running on `http://localhost:5173`

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Running on `http://localhost:5000`

## Project Structure

```
mindplay/
├── frontend/          # React frontend application
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # Express API server
│   ├── src/
│   │   ├── config/    # Environment & database config
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Auth & error handling
│   │   ├── models/    # MongoDB schemas
│   │   ├── routes/    # API routes
│   │   ├── app.js     # Express app setup
│   │   └── server.js  # Server entry point
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally or remote connection)
- npm or yarn

### Backend Setup

1. Navigate to backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   - `MONGODB_URI` - your MongoDB connection string
   - `JWT_SECRET` - a secure random string for JWT signing
   - `PORT` - server port (default: 5000)
   - `CLIENT_ORIGIN` - frontend URL (default: http://localhost:5173)

4. Start MongoDB (if running locally):
   ```bash
   mongod
   ```

5. Run the backend server:
   ```bash
   npm run dev
   ```
   
   Server will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser

## API Endpoints

### Authentication

- `POST /api/auth/register` - Create new account (username, password)
- `POST /api/auth/login` - Login (username, password)
- `GET /api/auth/me` - Get current user (requires auth token)
- `POST /api/auth/logout` - Logout

### Health Check

- `GET /health` - Server health check

## Development

### Running Both Servers

You'll need two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Authentication Flow

1. User registers/logs in via frontend
2. Backend returns JWT token
3. Frontend stores token (localStorage)
4. Frontend includes token in `Authorization: Bearer <token>` header for protected routes
5. Backend middleware verifies token before allowing access

## User Flow

### Getting Started

1. **Landing Page** - Users arrive at the dashboard with options to login or register
2. **Authentication** - Create an account or login with existing credentials
3. **Dashboard** - After authentication, users see a welcome message and "Play" button

### Lobby System

The application uses a real-time WebSocket-based lobby system for multiplayer gameplay:

#### Creating a Lobby

1. Click the **"Play"** button from the dashboard
2. On the lobby page, click **"Create Lobby"**
3. A unique lobby code is generated (e.g., "ABC123")
4. Share this code with a friend to invite them

#### Lobby Privacy Settings

- **Default Privacy**: All new lobbies are created as **private**
- **Host Controls**: Only the lobby host can toggle privacy settings
- **Privacy Toggle Button**: Located below the lobby description
  - Shows "Make Public" when lobby is private
  - Shows "Make Private" when lobby is public
- **Status Indicator**: Displays current privacy status with color coding
  - **Green**: "Lobby is currently Public" - visible in public lobby browser
  - **Red**: "Lobby is currently Private" - hidden from public lobby browser

#### Joining a Lobby

**Option 1: Direct Join (Private or Public)**
1. Enter the lobby code in the "Join a Lobby" box
2. Click **"Join Lobby"**
3. You'll be connected to the lobby immediately

**Option 2: Public Lobby Browser**
1. Scroll down to view the "Public Lobbies" section
2. Browse available public lobbies showing:
   - Lobby code
   - Host username
   - Current player count (X/2)
3. Click **"Join"** on any available lobby
4. Note: Full lobbies (2/2 players) are automatically hidden

#### In the Lobby

- **Player List**: Shows all connected players (max 2)
- **Host Indicator**: The lobby creator is marked as "(Host)"
- **Privacy Controls**: Host can toggle between public/private at any time
- **Start Game**: Host can start the game when ready (feature in development)
- **Leave Lobby**: Any player can leave the lobby at any time

#### WebSocket Communication

The lobby system uses WebSocket connections for real-time updates:
- Instant player join/leave notifications
- Live lobby privacy status changes
- Automatic public lobby list refresh
- Host migration on disconnect

## Testing

See `backend/README.md` for detailed API testing instructions with Postman.

## License

See LICENSE file for details.