import { WebSocketServer } from 'ws';
import url from 'url';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';

const lobbies = new Map();

function generateLobbyCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function broadcastLobbyUpdate(lobbyId) {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return;

  const players = Array.from(lobby.players.values());
  const message = JSON.stringify({ type: 'LOBBY_UPDATE', lobbyId, players });

  lobby.players.forEach((player) => {
    player.ws.send(message);
  });
}

function handleMessage(ws, message) {
  try {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'CREATE_LOBBY': {
        const lobbyId = generateLobbyCode();
        const newLobby = { id: lobbyId, players: new Map() };
        lobbies.set(lobbyId, newLobby);

        ws.lobbyId = lobbyId;
        newLobby.players.set(ws.user.id, { ...ws.user, ws });

        ws.send(JSON.stringify({ type: 'LOBBY_CREATED', lobbyId }));
        broadcastLobbyUpdate(lobbyId);
        break;
      }

      case 'JOIN_LOBBY': {
        const { lobbyId } = data;
        const lobby = lobbies.get(lobbyId);

        if (lobby) {
          ws.lobbyId = lobbyId;
          lobby.players.set(ws.user.id, { ...ws.user, ws });
          broadcastLobbyUpdate(lobbyId);
        } else {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Lobby not found' }));
        }
        break;
      }
    }
  } catch (error) {
    console.error('Failed to handle message:', error);
  }
}

export function createWebSocketServer(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', async (ws, req) => {
    try {
      const token = url.parse(req.url, true).query.token;
      if (!token) return ws.close(1008, 'Authentication token required');

      const payload = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(payload.sub).lean();
      if (!user) return ws.close(1008, 'Invalid user');

      ws.user = { id: user._id.toString(), username: user.username };
      console.log(`Client ${ws.user.username} connected`);

      ws.on('message', (message) => handleMessage(ws, message));

      ws.on('close', () => {
        if (ws.lobbyId) {
          const lobby = lobbies.get(ws.lobbyId);
          if (lobby) {
            lobby.players.delete(ws.user.id);
            if (lobby.players.size === 0) {
              lobbies.delete(ws.lobbyId);
            } else {
              broadcastLobbyUpdate(ws.lobbyId);
            }
          }
        }
        console.log(`Client ${ws.user.username} disconnected`);
      });
    } catch (error) {
      console.error('WebSocket connection error:', error.message);
      ws.close(1008, 'Invalid authentication token');
    }
  });

  return wss;
}
