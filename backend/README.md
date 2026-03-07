# Mindplay Backend

Express + MongoDB backend for Mindplay game with JWT authentication.

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

## API Endpoints

### Public Routes

- `GET /health` - Health check
- `POST /api/auth/register` - Create new account
  ```json
  {
    "username": "player1",
    "password": "secret123"
  }
  ```
- `POST /api/auth/login` - Login
  ```json
  {
    "username": "player1",
    "password": "secret123"
  }
  ```
- `POST /api/auth/logout` - Logout (client-side token removal)

### Protected Routes

- `GET /api/auth/me` - Get current user (requires `Authorization: Bearer <token>`)

## Protecting Routes

Use the `requireAuth` middleware to protect any route:

```javascript
import { requireAuth } from '../middleware/auth.js';

router.get('/protected-route', requireAuth, (req, res) => {
  // req.userId contains the authenticated user's ID
  res.json({ userId: req.userId });
});
```

## Frontend Integration

After login/register, store the token and include it in requests:

```javascript
// Store token
localStorage.setItem('token', response.token);

// Include in requests
fetch('http://localhost:5000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```
