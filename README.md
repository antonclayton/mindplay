# Mindplay

A real-time multiplayer Rock Paper Scissors game with competitive stats tracking, built with React and WebSocket technology.

## About the Game

Mindplay is a modern take on the classic Rock Paper Scissors game, featuring:
- **Real-time multiplayer** gameplay via WebSocket connections
- **Competitive scoring** - First to 3 rounds wins
- **Player statistics** tracking (wins, losses, move preferences)
- **Move history** - See your opponent's last 7 moves
- **Live chat** during matches
- **Public/Private lobbies** for flexible matchmaking
- **30-second round timers** to keep games moving

## Tech Stack

**Frontend:**
- React 18 + Vite
- React Router for navigation
- Zustand for state management
- WebSocket for real-time communication
- Running on `http://localhost:5173`

**Backend:**
- Node.js + Express
- MongoDB + Mongoose for data persistence
- JWT Authentication
- WebSocket (ws) for real-time game state
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
- **Start Game**: Host can start the game when 2 players are present
- **Leave Lobby**: Any player can leave the lobby at any time

### Gameplay Flow

Once the host starts the game with 2 players, the real-time Rock Paper Scissors match begins:

#### Game Interface

The game screen is divided into three panels:

**Left Panel - Opponent Intel:**
- Opponent's username
- Lifetime statistics (total games, wins, losses, win rate)
- Move preferences (rock/paper/scissors throw percentages)
- Last 7 moves history
- Leave Game (Forfeit) button

**Center Panel - Game Area:**
- Current score display (You vs Opponent)
- Round result display with move emojis
- Three move buttons: Rock ✊, Paper ✋, Scissors ✌️
- 30-second round timer
- 5-second countdown between rounds

**Right Panel - Match History & Chat:**
- Visual history of all rounds played this match
- Live chat with your opponent
- Move indicators showing what each player threw

#### Round Flow

1. **Round Start**: 30-second timer begins
2. **Move Selection**: Both players select rock, paper, or scissors
3. **Move Submission**: Click your chosen move to lock it in
4. **Waiting**: "Waiting for opponent..." message appears
5. **Round Result**: Both moves are revealed simultaneously
   - Win: Your move beats opponent's move
   - Lose: Opponent's move beats your move
   - Draw: Both players chose the same move
6. **Score Update**: Winner gets 1 point (draws award no points)
7. **5-Second Countdown**: Brief pause showing the result
8. **Next Round**: New 30-second timer starts automatically

#### Winning the Game

- **Victory Condition**: First player to win 3 rounds wins the match
- **Game Over Screen**: Displays final score and match statistics
- **Play Again**: Host can request a rematch
  - Opponent receives "Play Again?" prompt
  - If accepted, a new game starts immediately
  - Stats from previous game are saved
- **Back to Lobby**: Return to lobby browser to find a new opponent

#### Special Situations

**Round Timeout:**
- If a player doesn't submit a move within 30 seconds, they automatically lose that round
- The opponent who submitted a move wins the round

**Forfeit:**
- Any player can leave the game at any time using "Leave Game (Forfeit)"
- The leaving player receives a loss
- The remaining player receives a win
- Both players are returned to the lobby browser
- Stats are updated immediately

**Chat:**
- Send messages to your opponent during the match
- Messages appear in real-time in the right panel
- Chat history is preserved for the duration of the match

#### Statistics Tracking

After each game (win, loss, or forfeit), the following stats are updated:
- Total games played
- Wins / Losses / Draws
- Win rate percentage
- Rock throws count
- Paper throws count
- Scissors throws count
- Last 7 moves (visible to future opponents)

These stats are displayed to opponents in future matches, allowing for strategic gameplay based on move patterns.

### Stats & Leaderboard

#### Personal Stats Page

Track your performance with detailed statistics accessible from the navbar:

- **Record**: Total games, wins, losses, draws, and win rate percentage
- **Streaks**: Current streak (W/L) and best winning streak
  - Green indicator for win streaks (e.g., "5W")
  - Red indicator for loss streaks (e.g., "3L")
- **Move Distribution**: Visual bar charts showing rock/paper/scissors usage percentages
  - Uses Lucide React icons for consistent visual representation
  - Displays actual throw counts and percentages
- **Last 7 Moves**: Historical record of your most recent moves across all games

**Behavior:**
- Stats update in real-time after each game completion
- Forfeit games count toward stats (win/loss + all moves played)
- All moves thrown during a game are tracked, even if the game ends early
- Move history is capped at 7 most recent moves

#### Leaderboard

Competitive ranking system showing the top 20 players:

- **Eligibility**: Minimum 5 games played to appear on leaderboard
- **Score Calculation**: 
  ```
  score = wins × (totalGames / (totalGames + 10))
  ```
  - Rewards both winning and playing more games
  - Prevents new players with lucky wins from dominating
  - Scaling factor approaches 1.0 as games played increases
  - Example: 20 wins in 30 games = 20 × (30/40) = 15.0 score
  
- **Sorting**: Ranked by score (descending), then wins, then total games
- **Display**: Shows rank, username, score, W/L/D, games played, and win rate
  - Top 3 positions marked with medals: 🥇 🥈 🥉
  - Your entry is highlighted in blue if you're on the leaderboard
  - "You" badge appears next to your username
- **Color Coding**: Wins in green, losses in red for easy scanning

#### Move Tracking System

The game comprehensively tracks all moves (rock/paper/scissors) thrown during gameplay:
- Moves are counted immediately when submitted during a round
- Move history (last 7 moves) is saved to your profile after each game
- Move distribution percentages are calculated from lifetime totals
- Opponent's move preferences and last 7 moves are displayed during matches for strategic advantage
- Forfeit games still count all moves played up to that point

## WebSocket Communication

The application uses WebSocket connections for real-time updates:
- Instant player join/leave notifications
- Live lobby privacy status changes
- Automatic public lobby list refresh
- Real-time move submissions and round results
- Live chat messages
- Game state synchronization

## Testing

See `backend/README.md` for detailed API testing instructions.

For detailed frontend and backend documentation, see:
- `frontend/README.md` - Frontend architecture and components
- `backend/README.md` - API endpoints and WebSocket messages

## License

See LICENSE file for details.