import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';

export function Lobby() {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [lobbyId, setLobbyId] = useState(null);
  const [hostId, setHostId] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = new WebSocket(`${WEBSOCKET_URL}?token=${token}`);

    socket.onopen = () => console.log('WebSocket connected');
    socket.onclose = () => console.log('WebSocket disconnected');

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setError('');

      switch (message.type) {
        case 'LOBBY_UPDATE':
          setLobbyId(message.lobbyId);
          setHostId(message.hostId);
          setPlayers(message.players);
          break;
        case 'LOBBY_CREATED':
          setLobbyId(message.lobbyId);
          break;
        case 'LOBBY_CLOSED':
          alert(message.message);
          setLobbyId(null);
          setHostId(null);
          setPlayers([]);
          break;
        case 'GAME_STARTING':
          alert('The game is starting!');
          // Future: navigate to game screen
          break;
        case 'ERROR':
          setError(message.message);
          break;
      }
    };

    setWs(socket);

    return () => socket.close();
  }, []);

  const handleCreateLobby = () => {
    if (ws) ws.send(JSON.stringify({ type: 'CREATE_LOBBY' }));
  };

  const handleJoinLobby = (e) => {
    e.preventDefault();
    if (ws && joinCode) {
      ws.send(JSON.stringify({ type: 'JOIN_LOBBY', lobbyId: joinCode.toUpperCase() }));
    }
  };

  const handleLeaveLobby = () => {
    if (ws) ws.send(JSON.stringify({ type: 'LEAVE_LOBBY' }));
    setLobbyId(null);
    setHostId(null);
    setPlayers([]);
  };

  const handleStartGame = () => {
    if (ws) ws.send(JSON.stringify({ type: 'START_GAME' }));
  };

  if (!lobbyId) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Join or Create a Lobby</h1>
        <div style={styles.actions}>
          <button onClick={handleCreateLobby} style={styles.button}>
            Create Lobby
          </button>
          <form onSubmit={handleJoinLobby} style={styles.joinForm}>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter Lobby Code"
              style={styles.input}
            />
            <button type="submit" style={styles.button}>Join Lobby</button>
          </form>
          {error && <p style={styles.error}>{error}</p>}
        </div>
      </div>
    );
  }

  const isHost = user?.id === hostId;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Lobby Code: {lobbyId}</h1>
      <p style={styles.instructions}>Share this code with a friend. The game starts when two players are in the lobby.</p>
      <div style={styles.playerList}>
        <h2 style={styles.subtitle}>Players ({players.length}/2)</h2>
        {players.map((player) => (
          <div key={player.id} style={styles.playerItem}>
            {player.username} {player.id === hostId && '(Host)'}
          </div>
        ))}
      </div>
      <div style={styles.controls}>
        {isHost && (
          <button 
            onClick={handleStartGame} 
            disabled={players.length !== 2} 
            style={{
              ...styles.button, 
              ...(players.length !== 2 ? styles.disabledButton : {}),
            }}
          >
            Start Game
          </button>
        )}
        <button onClick={handleLeaveLobby} style={{...styles.button, ...styles.leaveButton}}>
          Leave Lobby
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 73px)', padding: '2rem', textAlign: 'center' },
  contentWrapper: { maxWidth: '600px', width: '100%' },
  title: { fontSize: '2.5rem', marginBottom: '1rem' },
  subtitle: { fontSize: '1.5rem', marginBottom: '1rem', color: '#aaa' },
  actions: { display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginTop: '2rem' },
  joinForm: { display: 'flex', gap: '0.5rem' },
  input: { padding: '0.75rem', fontSize: '1.1rem', backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '4px', color: '#fff' },
  button: { padding: '0.75rem 1.5rem', fontSize: '1.1rem', cursor: 'pointer', border: 'none', borderRadius: '4px', backgroundColor: '#4a90e2', color: '#fff' },
  leaveButton: { backgroundColor: '#c94c4c' },
  error: { color: '#ff6b6b', marginTop: '1rem' },
  instructions: { color: '#888', fontSize: '1rem', marginBottom: '2rem', marginTop: '-0.5rem' },
  playerList: { display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '2rem', width: '100%', maxWidth: '500px' },
  playerItem: { padding: '1rem', fontSize: '1.2rem', backgroundColor: '#2a2a2a', borderRadius: '8px', width: '100%' },
  controls: { display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '1rem', alignItems: 'center', marginTop: '2rem' },
  disabledButton: { backgroundColor: '#555', opacity: 0.6, cursor: 'not-allowed' },
};
