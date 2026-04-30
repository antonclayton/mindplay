# Mindplay Frontend

React + Vite frontend for Mindplay Rock Paper Scissors game with real-time WebSocket gameplay.

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
   - `VITE_API_URL` - Backend API URL (default: http://localhost:5000)
   - `VITE_WS_URL` - WebSocket URL (default: ws://localhost:5000)

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Button.jsx   # Animated button with variants
│   │   ├── MoveButton.jsx  # Rock/Paper/Scissors button
│   │   └── Navbar.jsx   # Navigation bar
│   ├── context/         # React Context providers
│   │   └── AuthContext.jsx  # Authentication state
│   ├── pages/           # Route components
│   │   ├── Dashboard.jsx    # Home/landing page
│   │   ├── Login.jsx        # Login form
│   │   ├── Register.jsx     # Registration form
│   │   ├── Lobby.jsx        # Lobby management
│   │   ├── Game.jsx         # Main game interface
│   │   ├── Stats.jsx        # Personal statistics page
│   │   └── Leaderboard.jsx  # Competitive rankings
│   ├── stores/          # Zustand state management
│   │   └── gameStore.js     # Game state store
│   ├── App.jsx          # Root component with routing
│   └── main.jsx         # Entry point
```

## Tech Stack

- **React 18** - UI library
- **React Router** - Client-side routing
- **Zustand** - Lightweight state management
- **Vite** - Build tool and dev server
- **Lucide React** - Icon library for consistent UI elements
- **WebSocket** - Real-time communication

## Components

### Button Component
Reusable button with hover animations and multiple variants:
- `primary` - Blue (default)
- `secondary` - Gray
- `success` - Green
- `danger` - Red
- `warning` - Orange
- `ghost` - Transparent with border

```jsx
<Button onClick={handleClick} variant="success" fullWidth={false}>
  Click Me
</Button>
```

### MoveButton Component
Specialized button for Rock/Paper/Scissors moves with emoji display and hover effects.

```jsx
<MoveButton
  move="rock"
  onClick={() => handleMove('rock')}
  disabled={false}
  selected={selectedMove === 'rock'}
  emoji="✊"
/>
```

## State Management

### AuthContext
Manages user authentication state and provides:
- `user` - Current user object
- `login(username, password)` - Login function
- `register(username, password)` - Registration function
- `logout()` - Logout function

### Game Store (Zustand)
Manages game state including:
- `ws` - WebSocket connection
- `opponent` - Opponent info
- `myScore` / `opponentScore` - Current scores
- `roundResult` - Last round outcome
- `sessionStats` - Current game statistics
- `chatMessages` - In-game chat history

## Pages

### Dashboard
Landing page with "Play" button. Redirects to login if not authenticated, otherwise to lobby.

### Login / Register
Authentication forms with error handling and loading states.

### Lobby
Two modes:
1. **Lobby Browser** - Create or join lobbies
   - Create new public lobby
   - Join by code
   - Browse public lobbies
2. **In Lobby** - Waiting room
   - Display lobby code
   - Show player list (2/2)
   - Toggle public/private (host only)
   - Start game (host only, requires 2 players)

### Game
Main gameplay interface with:
- **Left Panel**: Opponent stats and forfeit button
- **Center**: Game area with move buttons, scores, timers
- **Right Panel**: Move history and chat

## WebSocket Integration

Connect to backend WebSocket in Lobby:
```javascript
const ws = new WebSocket(`${WEBSOCKET_URL}?token=${token}`);
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Handle message types
};
```

Message types handled:
- `LOBBY_UPDATE` - Player list changes
- `GAME_STARTING` - Navigate to game
- `ROUND_RESULT` - Update scores and display result
- `ROUND_TIMER_START` - Start 30-second countdown
- `GAME_OVER` - Show final results
- `CHAT_MESSAGE` - Display chat message

## Pages

### Stats Page (`/stats`)

Personal statistics dashboard showing:
- Win/loss/draw record with color-coded values
- Current and best win streaks
- Move distribution bar charts with Lucide icons
- Real-time data fetching from `/api/users/me/stats`

**Key Features:**
- Responsive card layout with blue theme (`#4a90e2`)
- Visual progress bars for move percentages
- Streak indicators (green for wins, red for losses)
- Loading and error states
- Icon integration: Circle (rock), Hand (paper), Scissors

### Leaderboard Page (`/leaderboard`)

Competitive ranking table displaying top 20 players:
- Medal icons (🥇🥈🥉) for top 3 positions
- Table columns: rank, player, score, W/L/D, games, win rate
- Current user highlighting with blue background
- Minimum 5 games requirement to appear

**Key Features:**
- Responsive table layout with gold theme (`#f39c12`)
- Real-time data from `/api/leaderboard`
- "You" badge for current user's row
- Color-coded wins (green) and losses (red)
- Score calculation displayed: `wins × (totalGames / (totalGames + 10))`

## Styling

All styles use CSS-in-JS with inline style objects. Color scheme:
- Background: `#0a0a0a` (dark)
- Cards: `#1a1a1a` / `#2a2a2a`
- Borders: `#333` / `#444`
- Primary: `#4a90e2` (blue)
- Success: `#28a745` (green)
- Danger: `#dc3545` / `#e74c3c` (red)
- Warning: `#f39c12` (gold/orange)
- Text: `#fff` / `#aaa`

## Development

### Adding New Pages
1. Create component in `src/pages/`
2. Add route in `App.jsx`
3. Update navigation if needed

### Adding New Components
1. Create component in `src/components/`
2. Export as named export
3. Import where needed

### State Updates
- Use Zustand store for game state
- Use AuthContext for user state
- Use local state for UI-only state

### API Calls
```javascript
const API_URL = import.meta.env.VITE_API_URL;
const token = localStorage.getItem('token');

const response = await fetch(`${API_URL}/api/endpoint`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Build & Deploy

```bash
# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

Build output goes to `dist/` directory.
