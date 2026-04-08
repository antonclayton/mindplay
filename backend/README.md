# Mindplay Backend

Express + MongoDB backend for Mindplay Rock Paper Scissors game with JWT authentication and WebSocket support.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   - `MONGODB_URI` - your MongoDB connection string
   - `JWT_SECRET` - a secure random string for signing tokens
   - `PORT` - server port (default: 5000)
   - `CLIENT_ORIGIN` - frontend URL (default: http://localhost:5173)

3. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

4. **Run the server**
   ```bash
   npm run dev
   ```

## Project Structure

```
backend/
├── src/
│   ├── controllers/       # Business logic handlers
│   │   ├── auth.controller.js
│   │   └── users.controller.js
│   ├── middleware/        # Express middleware
│   │   └── auth.js       # JWT authentication
│   ├── models/           # MongoDB schemas
│   │   └── User.js
│   ├── routes/           # API route definitions
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   └── index.js
│   ├── websocket/        # WebSocket game logic
│   │   └── index.js
│   └── server.js         # Entry point
```

## API Endpoints

### Authentication Routes

- `POST /api/auth/register` - Create new account
  ```json
  {
    "username": "player1",
    "password": "secret123"
  }
  ```
  Response: `{ token, user: { id, username } }`

- `POST /api/auth/login` - Login
  ```json
  {
    "username": "player1",
    "password": "secret123"
  }
  ```
  Response: `{ token, user: { id, username } }`

- `GET /api/auth/me` - Get current user (requires auth)
  Response: `{ id, username, stats, lastMoves }`

### User Stats Routes (Protected)

- `GET /api/users/me/stats` - Get current user's stats
  Response: `{ stats: { totalGames, wins, losses, draws, rockThrows, paperThrows, scissorsThrows } }`

- `PATCH /api/users/me/stats` - Update current user's stats
  ```json
  {
    "stats": {
      "totalGames": 1,
      "wins": 1,
      "losses": 0,
      "draws": 0,
      "rockThrows": 2,
      "paperThrows": 1,
      "scissorsThrows": 0
    },
    "newMoves": ["rock", "paper", "rock"]
  }
  ```
  Response: `{ stats, lastMoves }`

- `GET /api/users/:userId/stats` - Get another user's stats
  Response: `{ username, stats }`

## WebSocket API

Connect to WebSocket with JWT token:
```javascript
const ws = new WebSocket(`ws://localhost:5000?token=${token}`);
```

### Lobby Management Messages

**CREATE_LOBBY**
```json
{ "type": "CREATE_LOBBY" }
```
Response: `LOBBY_CREATED` with `lobbyId`

**JOIN_LOBBY**
```json
{ "type": "JOIN_LOBBY", "lobbyId": "ABC123" }
```
Response: `LOBBY_UPDATE` with player list

**LEAVE_LOBBY**
```json
{ "type": "LEAVE_LOBBY" }
```

**TOGGLE_LOBBY_PRIVACY**
```json
{ "type": "TOGGLE_LOBBY_PRIVACY" }
```
Response: `LOBBY_UPDATE` with updated `isPublic` status

**START_GAME** (host only)
```json
{ "type": "START_GAME" }
```
Response: `GAME_STARTING` to both players

### Game Messages

**SUBMIT_MOVE**
```json
{ "type": "SUBMIT_MOVE", "move": "rock" | "paper" | "scissors" }
```
Response: `MOVE_ACCEPTED`, then `ROUND_RESULT` when both players submit

**LEAVE_GAME**
```json
{ "type": "LEAVE_GAME" }
```
Response: `GAME_FORFEIT` to leaving player, `OPPONENT_FORFEIT` to other player

**PLAY_AGAIN_REQUEST** (host only)
```json
{ "type": "PLAY_AGAIN_REQUEST" }
```
Response: `PLAY_AGAIN_REQUESTED` to opponent

**PLAY_AGAIN_ACCEPT**
```json
{ "type": "PLAY_AGAIN_ACCEPT" }
```
Response: `GAME_STARTING` to both players

**CHAT_MESSAGE**
```json
{ "type": "CHAT_MESSAGE", "message": "Hello!" }
```

### Server-Sent Messages

- `LOBBY_UPDATE` - Player list and lobby state changes
- `PUBLIC_LOBBIES_UPDATE` - List of available public lobbies
- `GAME_STARTING` - Game initialization with opponent info
- `ROUND_TIMER_START` - 30-second round timer started
- `ROUND_RESULT` - Round outcome (win/lose/draw)
- `GAME_OVER` - Final game result
- `OPPONENT_MOVED` - Opponent submitted their move
- `LOBBY_CLOSED` - Lobby was closed
- `ERROR` - Error message

## Game Logic

### Constants
- `WINNING_SCORE = 3` - First to 3 rounds wins
- `ROUND_TIMEOUT = 30000` - 30 seconds per round
- `ROUND_RESULT_DELAY = 5000` - 5 second delay between rounds

### Game Flow
1. Host creates lobby, shares code with opponent
2. Opponent joins lobby
3. Host starts game → `GAME_STARTING` sent to both players
4. 500ms delay → `ROUND_TIMER_START` (30 seconds)
5. Both players submit moves → `ROUND_RESULT` sent
6. 5 second countdown → `ROUND_TIMER_START` for next round
7. Repeat until one player reaches 3 wins
8. `GAME_OVER` sent with final result

### Forfeit Handling
- Leaving player receives `GAME_FORFEIT` (loss)
- Remaining player receives `OPPONENT_FORFEIT` (win)
- Stats are updated immediately
- Lobby is closed and removed

## Development

### MVC Pattern
- **Models**: Define data schemas (User)
- **Controllers**: Handle business logic (auth, users)
- **Routes**: Map endpoints to controllers
- **WebSocket**: Real-time game state management

### Authentication
Use `requireAuth` middleware for protected routes:
```javascript
import { requireAuth } from '../middleware/auth.js';

router.get('/protected', requireAuth, controller);
// req.userId available in controller
```

### Adding New Features
1. Create controller function in `src/controllers/`
2. Define route in `src/routes/`
3. Import and use in `src/routes/index.js`
4. Update this README with new endpoints
