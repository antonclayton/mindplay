import { WebSocketServer } from 'ws';
import url from 'url';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';

const lobbies = new Map();
const games = new Map();
const gameTimers = new Map();

const WINNING_SCORE = 3;
const ROUND_TIMEOUT = 30000;

function generateLobbyCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function determineRoundWinner(move1, move2) {
  if (move1 === move2) return 'draw';
  if (
    (move1 === 'rock' && move2 === 'scissors') ||
    (move1 === 'paper' && move2 === 'rock') ||
    (move1 === 'scissors' && move2 === 'paper')
  ) {
    return 'player1';
  }
  return 'player2';
}

function startRoundTimer(gameId) {
  if (gameTimers.has(gameId)) {
    clearTimeout(gameTimers.get(gameId));
  }
  
  const timer = setTimeout(() => {
    const game = games.get(gameId);
    const lobby = lobbies.get(gameId);
    if (!game || game.state !== 'playing' || !lobby) return;
    
    const p1Moved = !!game.player1.move;
    const p2Moved = !!game.player2.move;
    
    if (p1Moved && p2Moved) return;
    
    let result;
    if (!p1Moved && !p2Moved) {
      result = 'draw';
      game.player1.move = 'timeout';
      game.player2.move = 'timeout';
    } else if (!p1Moved) {
      result = 'player2';
      game.player1.move = 'timeout';
      game.player2.score++;
    } else {
      result = 'player1';
      game.player2.move = 'timeout';
      game.player1.score++;
    }
    
    const roundResult = {
      type: 'ROUND_RESULT',
      round: game.round,
      player1Move: game.player1.move,
      player2Move: game.player2.move,
      winner: result,
      timeout: true,
      scores: { player1: game.player1.score, player2: game.player2.score },
    };
    
    lobby.players.forEach((p) => {
      const isP1 = p.id === game.player1.id;
      p.ws.send(JSON.stringify({
        ...roundResult,
        myMove: isP1 ? game.player1.move : game.player2.move,
        opponentMove: isP1 ? game.player2.move : game.player1.move,
        result: result === 'draw' ? 'draw' : (result === 'player1' ? (isP1 ? 'win' : 'lose') : (isP1 ? 'lose' : 'win')),
        myScore: isP1 ? game.player1.score : game.player2.score,
        opponentScore: isP1 ? game.player2.score : game.player1.score,
      }));
    });
    
    game.player1.move = null;
    game.player2.move = null;
    game.round++;
    
    if (game.player1.score >= WINNING_SCORE || game.player2.score >= WINNING_SCORE) {
      game.state = 'finished';
      gameTimers.delete(gameId);
      const winner = game.player1.score >= WINNING_SCORE ? 'player1' : 'player2';
      
      lobby.players.forEach((p) => {
        const isP1 = p.id === game.player1.id;
        const gameResult = winner === 'player1' ? (isP1 ? 'win' : 'lose') : (isP1 ? 'lose' : 'win');
        p.ws.send(JSON.stringify({
          type: 'GAME_OVER',
          result: gameResult,
          finalScores: { myScore: isP1 ? game.player1.score : game.player2.score, opponentScore: isP1 ? game.player2.score : game.player1.score },
        }));
      });
    } else {
      startRoundTimer(gameId);
      lobby.players.forEach((p) => {
        p.ws.send(JSON.stringify({ type: 'ROUND_TIMER_START', seconds: 30 }));
      });
    }
  }, ROUND_TIMEOUT);
  
  gameTimers.set(gameId, timer);
}

function broadcastToLobby(lobbyId, message) {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return;
  const stringifiedMessage = JSON.stringify(message);
  lobby.players.forEach((player) => player.ws.send(stringifiedMessage));
}

function broadcastLobbyUpdate(lobbyId) {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return;
  const players = Array.from(lobby.players.values()).map(({ id, username }) => ({ id, username }));
  broadcastToLobby(lobbyId, { type: 'LOBBY_UPDATE', lobbyId, hostId: lobby.hostId, players, isPublic: lobby.isPublic });
}

function broadcastPublicLobbies(wss) {
  const publicLobbies = Array.from(lobbies.values())
    .filter(lobby => lobby.isPublic && lobby.state === 'waiting' && lobby.players.size < 2)
    .map(lobby => ({ 
      id: lobby.id, 
      playerCount: lobby.players.size,
      hostUsername: lobby.players.get(lobby.hostId)?.username || 'Unknown'
    }));

  const message = JSON.stringify({ type: 'PUBLIC_LOBBIES_UPDATE', lobbies: publicLobbies });
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN && !client.lobbyId) {
      client.send(message);
    }
  });
}

function joinLobby(ws, lobbyId, wss) {
  const lobby = lobbies.get(lobbyId);
  if (lobby && lobby.players.size < 2) {
    ws.lobbyId = lobbyId;
    lobby.players.set(ws.user.id, { ...ws.user, ws });
    broadcastLobbyUpdate(lobbyId);
    broadcastPublicLobbies(wss);
  } else if (lobby) {
    ws.send(JSON.stringify({ type: 'ERROR', message: 'Lobby is full' }));
  } else {
    ws.send(JSON.stringify({ type: 'ERROR', message: 'Lobby not found' }));
  }
}

function handleMessage(ws, message, wss) {
  try {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'CREATE_LOBBY': {
        const lobbyId = generateLobbyCode();
        const newLobby = { id: lobbyId, players: new Map(), hostId: ws.user.id, state: 'waiting', isPublic: false };
        lobbies.set(lobbyId, newLobby);
        joinLobby(ws, lobbyId, wss);
        break;
      }
      case 'JOIN_LOBBY':
        joinLobby(ws, data.lobbyId, wss);
        break;
      case 'LEAVE_LOBBY':
        leaveLobby(ws, wss);
        break;
      case 'TOGGLE_LOBBY_PRIVACY': {
        const lobby = lobbies.get(ws.lobbyId);
        if (lobby && lobby.hostId === ws.user.id) {
          lobby.isPublic = !lobby.isPublic;
          broadcastLobbyUpdate(ws.lobbyId);
          broadcastPublicLobbies(wss);
        }
        break;
      }
      case 'START_GAME': {
        const lobby = lobbies.get(ws.lobbyId);
        if (lobby && lobby.hostId === ws.user.id && lobby.players.size === 2) {
          lobby.state = 'playing';
          
          const playerIds = Array.from(lobby.players.keys());
          const game = {
            id: lobby.id,
            player1: { id: playerIds[0], score: 0, move: null },
            player2: { id: playerIds[1], score: 0, move: null },
            round: 1,
            state: 'playing',
          };
          games.set(lobby.id, game);
          
          const playersArray = Array.from(lobby.players.values());
          const gameStartPromises = playersArray.map(async (player, index) => {
            const opponentIndex = index === 0 ? 1 : 0;
            const opponent = playersArray[opponentIndex];
            
            try {
              const opponentUser = await User.findById(opponent.id).select('username stats lastMoves').lean();
              player.ws.send(JSON.stringify({
                type: 'GAME_STARTING',
                gameId: lobby.id,
                isHost: player.id === lobby.hostId,
                opponent: {
                  id: opponent.id,
                  username: opponent.username,
                  stats: opponentUser?.stats || null,
                  lastMoves: opponentUser?.lastMoves || [],
                },
              }));
            } catch (error) {
              console.error('Error fetching opponent stats:', error);
              player.ws.send(JSON.stringify({
                type: 'GAME_STARTING',
                gameId: lobby.id,
                isHost: player.id === lobby.hostId,
                opponent: { id: opponent.id, username: opponent.username, stats: null, lastMoves: [] },
              }));
            }
          });
          
          Promise.all(gameStartPromises).then(() => {
            // Small delay to ensure frontend Game component is mounted and ready
            setTimeout(() => {
              startRoundTimer(lobby.id);
              lobby.players.forEach((p) => {
                p.ws.send(JSON.stringify({ type: 'ROUND_TIMER_START', seconds: 30 }));
              });
            }, 500);
          });
          
          broadcastPublicLobbies(wss);
        } else {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Cannot start game' }));
        }
        break;
      }
      case 'SUBMIT_MOVE': {
        const game = games.get(ws.lobbyId);
        if (!game || game.state !== 'playing') {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'No active game' }));
          break;
        }
        
        const move = data.move;
        if (!['rock', 'paper', 'scissors'].includes(move)) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid move' }));
          break;
        }
        
        const isPlayer1 = game.player1.id === ws.user.id;
        const player = isPlayer1 ? game.player1 : game.player2;
        const opponent = isPlayer1 ? game.player2 : game.player1;
        
        if (player.move) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Move already submitted' }));
          break;
        }
        
        player.move = move;
        ws.send(JSON.stringify({ type: 'MOVE_ACCEPTED', move }));
        
        const lobby = lobbies.get(ws.lobbyId);
        if (lobby) {
          const opponentPlayer = lobby.players.get(opponent.id);
          if (opponentPlayer) {
            opponentPlayer.ws.send(JSON.stringify({ type: 'OPPONENT_MOVED' }));
          }
        }
        
        if (game.player1.move && game.player2.move) {
          const result = determineRoundWinner(game.player1.move, game.player2.move);
          
          if (result === 'player1') game.player1.score++;
          else if (result === 'player2') game.player2.score++;
          
          const roundResult = {
            type: 'ROUND_RESULT',
            round: game.round,
            player1Move: game.player1.move,
            player2Move: game.player2.move,
            winner: result,
            scores: { player1: game.player1.score, player2: game.player2.score },
          };
          
          if (lobby) {
            lobby.players.forEach((p) => {
              const isP1 = p.id === game.player1.id;
              const playerResult = result === 'draw' ? 'draw' : (result === 'player1' ? (isP1 ? 'win' : 'lose') : (isP1 ? 'lose' : 'win'));
              p.ws.send(JSON.stringify({
                ...roundResult,
                myMove: isP1 ? game.player1.move : game.player2.move,
                opponentMove: isP1 ? game.player2.move : game.player1.move,
                result: playerResult,
                myScore: isP1 ? game.player1.score : game.player2.score,
                opponentScore: isP1 ? game.player2.score : game.player1.score,
              }));
            });
          }
          
          game.player1.move = null;
          game.player2.move = null;
          game.round++;
          
          if (game.player1.score >= WINNING_SCORE || game.player2.score >= WINNING_SCORE) {
            game.state = 'finished';
            if (gameTimers.has(ws.lobbyId)) {
              clearTimeout(gameTimers.get(ws.lobbyId));
              gameTimers.delete(ws.lobbyId);
            }
            const winner = game.player1.score >= WINNING_SCORE ? 'player1' : 'player2';
            
            if (lobby) {
              lobby.players.forEach((p) => {
                const isP1 = p.id === game.player1.id;
                const gameResult = winner === 'player1' ? (isP1 ? 'win' : 'lose') : (isP1 ? 'lose' : 'win');
                p.ws.send(JSON.stringify({
                  type: 'GAME_OVER',
                  result: gameResult,
                  finalScores: { myScore: isP1 ? game.player1.score : game.player2.score, opponentScore: isP1 ? game.player2.score : game.player1.score },
                }));
              });
            }
            
            games.delete(ws.lobbyId);
          } else {
            // Delay timer start by 5 seconds to allow round result display
            setTimeout(() => {
              startRoundTimer(ws.lobbyId);
              if (lobby) {
                lobby.players.forEach((p) => {
                  p.ws.send(JSON.stringify({ type: 'ROUND_TIMER_START', seconds: 30 }));
                });
              }
            }, 5000);
          }
        }
        break;
      }
      case 'CHAT_MESSAGE': {
        const lobby = lobbies.get(ws.lobbyId);
        if (!lobby) break;
        
        const chatMessage = {
          type: 'CHAT_MESSAGE',
          senderId: ws.user.id,
          senderUsername: ws.user.username,
          message: data.message?.slice(0, 500) || '',
          timestamp: Date.now(),
        };
        
        lobby.players.forEach((p) => p.ws.send(JSON.stringify(chatMessage)));
        break;
      }
      case 'LEAVE_GAME': {
        const game = games.get(ws.lobbyId);
        const lobby = lobbies.get(ws.lobbyId);
        if (!game || !lobby) break;
        
        if (gameTimers.has(ws.lobbyId)) {
          clearTimeout(gameTimers.get(ws.lobbyId));
          gameTimers.delete(ws.lobbyId);
        }
        
        const leavingPlayerId = ws.user.id;
        
        lobby.players.forEach((player) => {
          if (player.id === leavingPlayerId) {
            player.ws.send(JSON.stringify({
              type: 'GAME_FORFEIT',
              message: 'You have forfeited the game.',
            }));
          } else {
            player.ws.send(JSON.stringify({
              type: 'OPPONENT_FORFEIT',
              message: 'Your opponent has left the game. You win!',
            }));
            player.ws.send(JSON.stringify({ 
              type: 'LOBBY_CLOSED', 
              message: lobby.hostId === leavingPlayerId ? 'The host has left the lobby.' : 'Your opponent has left the lobby.' 
            }));
          }
        });
        
        games.delete(ws.lobbyId);
        
        lobby.players.forEach(player => {
          player.ws.lobbyId = null;
        });
        lobbies.delete(lobby.id);
        
        broadcastPublicLobbies(wss);
        break;
      }
      case 'PLAY_AGAIN': {
        const lobby = lobbies.get(ws.lobbyId);
        if (!lobby || lobby.hostId !== ws.user.id) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Only the host can start a new game' }));
          break;
        }
        
        if (lobby.players.size !== 2) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Need 2 players to play again' }));
          break;
        }
        
        const playerIds = Array.from(lobby.players.keys());
        const game = {
          id: lobby.id,
          player1: { id: playerIds[0], score: 0, move: null },
          player2: { id: playerIds[1], score: 0, move: null },
          round: 1,
          state: 'playing',
        };
        games.set(lobby.id, game);
        
        const playersArray = Array.from(lobby.players.values());
        playersArray.forEach(async (player, index) => {
          const opponentIndex = index === 0 ? 1 : 0;
          const opponent = playersArray[opponentIndex];
          
          try {
            const opponentUser = await User.findById(opponent.id).select('username stats lastMoves').lean();
            player.ws.send(JSON.stringify({
              type: 'GAME_STARTING',
              gameId: lobby.id,
              isHost: player.id === lobby.hostId,
              opponent: {
                id: opponent.id,
                username: opponent.username,
                stats: opponentUser?.stats || null,
                lastMoves: opponentUser?.lastMoves || [],
              },
            }));
          } catch (error) {
            console.error('Error fetching opponent stats:', error);
            player.ws.send(JSON.stringify({
              type: 'GAME_STARTING',
              gameId: lobby.id,
              isHost: player.id === lobby.hostId,
              opponent: { id: opponent.id, username: opponent.username, stats: null, lastMoves: [] },
            }));
          }
        });
        
        startRoundTimer(lobby.id);
        lobby.players.forEach((p) => {
          p.ws.send(JSON.stringify({ type: 'ROUND_TIMER_START', seconds: 30 }));
        });
        break;
      }
    }
  } catch (error) {
    console.error('Failed to handle message:', error);
  }
}

function leaveLobby(ws, wss) {
  if (!ws.lobbyId) return;
  const lobby = lobbies.get(ws.lobbyId);
  if (!lobby) return;

  const isHost = lobby.hostId === ws.user.id;
  lobby.players.delete(ws.user.id);
  ws.lobbyId = null;

  if (isHost || lobby.players.size === 0) {
    broadcastToLobby(lobby.id, { type: 'LOBBY_CLOSED', message: 'The host has left the lobby.' });
    lobby.players.forEach(player => { player.ws.lobbyId = null; });
    lobbies.delete(lobby.id);
  } else {
    broadcastLobbyUpdate(lobby.id);
  }
  broadcastPublicLobbies(wss);
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

      broadcastPublicLobbies(wss); // Send initial list

      ws.on('message', (message) => handleMessage(ws, message, wss));
      ws.on('close', () => {
        leaveLobby(ws, wss);
        console.log(`Client ${ws.user.username} disconnected`);
      });
    } catch (error) {
      console.error('WebSocket connection error:', error.message);
      ws.close(1008, 'Invalid authentication token');
    }
  });

  return wss;
}
