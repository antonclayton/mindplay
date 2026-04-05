import { useState, useEffect } from 'react';

const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';

export function Lobby() {
  const [players, setPlayers] = useState([]);
  const [lobbyId, setLobbyId] = useState(null);
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
      switch (message.type) {
        case 'LOBBY_UPDATE':
          setLobbyId(message.lobbyId);
          setPlayers(message.players);
          break;
        case 'LOBBY_CREATED':
          setLobbyId(message.lobbyId);
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

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Lobby Code: {lobbyId}</h1>
      <p style={styles.instructions}>Share this code with a friend. The game starts when two players are in the lobby.</p>
      <div style={styles.playerList}>
        <h2 style={styles.subtitle}>Players</h2>
        {players.map((player) => (
          <div key={player.id} style={styles.playerItem}>
            {player.username}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' },
  title: { marginBottom: '1rem' },
  subtitle: { marginBottom: '1rem', color: '#aaa' },
  actions: { display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' },
  joinForm: { display: 'flex', gap: '0.5rem' },
  input: { padding: '0.5rem', fontSize: '1rem', backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '4px', color: '#fff' },
  button: { padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer', border: 'none', borderRadius: '4px', backgroundColor: '#4a90e2', color: '#fff' },
  error: { color: '#ff6b6b', marginTop: '1rem' },
  instructions: { color: '#888', fontSize: '0.9rem', marginBottom: '2rem', marginTop: '-0.5rem' },
  playerList: { display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' },
  playerItem: { padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px', width: '100%', maxWidth: '400px' },
};
