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

## Testing

See `backend/README.md` for detailed API testing instructions with Postman.

## License

See LICENSE file for details.