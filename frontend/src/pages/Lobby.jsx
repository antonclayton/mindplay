import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';

export function Lobby() {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [lobbyId, setLobbyId] = useState(null);
  const [hostId, setHostId] = useState(null);
  const [publicLobbies, setPublicLobbies] = useState([]);
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
        case 'PUBLIC_LOBBIES_UPDATE':
          setPublicLobbies(message.lobbies);
          break;
        case 'LOBBY_CLOSED':
          alert(message.message);
          setLobbyId(null);
          setHostId(null);
          setPlayers([]);
          break;
        case 'GAME_STARTING':
          alert('The game is starting!');
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

  const handleJoinLobby = (lobbyIdToJoin) => {
    if (ws && lobbyIdToJoin) {
      ws.send(JSON.stringify({ type: 'JOIN_LOBBY', lobbyId: lobbyIdToJoin.toUpperCase() }));
    }
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    handleJoinLobby(joinCode);
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
        <div style={styles.contentWrapper}>
          <h1 style={styles.title}>Join or Create a Lobby</h1>
          <div style={styles.selectionContainer}>
            <div style={styles.box}>
              <h2 style={styles.boxTitle}>Create a Lobby</h2>
              <p style={styles.boxDescription}>Start a new public lobby and invite a friend.</p>
              <button onClick={handleCreateLobby} style={styles.button}>Create Lobby</button>
            </div>
            <div style={styles.box}>
              <h2 style={styles.boxTitle}>Join a Lobby</h2>
              <p style={styles.boxDescription}>Enter a code to join a specific lobby.</p>
              <form onSubmit={handleJoinSubmit} style={styles.joinForm}>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter Lobby Code"
                  style={styles.input}
                />
                <button type="submit" style={styles.button}>Join Lobby</button>
              </form>
            </div>
          </div>
          {error && <p style={styles.error}>{error}</p>}

          <div style={{...styles.box, ...styles.browserBox}}>
            <h2 style={styles.boxTitle}>Public Lobbies</h2>
            <div style={styles.lobbyList}>
              {publicLobbies.length > 0 ? (
                publicLobbies.map(lobby => (
                  <div key={lobby.id} style={styles.lobbyItem}>
                    <div style={styles.lobbyInfo}>
                      <span style={styles.lobbyIdText}>Code: {lobby.id}</span>
                      <span style={styles.hostName}>Host: {lobby.hostUsername}</span>
                    </div>
                    <div style={styles.lobbyActions}>
                      <span style={styles.playerCount}>{lobby.playerCount}/2 Players</span>
                      <button onClick={() => handleJoinLobby(lobby.id)} style={styles.joinButton}>Join</button>
                    </div>
                  </div>
                ))
              ) : (
                <p style={styles.boxDescription}>No public lobbies available. Create one!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isHost = user?.id === hostId;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Lobby Code: {lobbyId}</h1>
      <p style={styles.instructions}>Share this code with a friend.<br />The game starts when the lobby host presses "Start Game".</p>
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
  container: { display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', minHeight: 'calc(100vh - 73px)', padding: '2rem', paddingTop: '4rem', textAlign: 'center' },
  contentWrapper: { maxWidth: '800px', width: '100%' },
  title: { fontSize: '2.5rem', marginBottom: '2rem' },
  selectionContainer: { display: 'flex', justifyContent: 'center', gap: '2rem', alignItems: 'stretch', marginBottom: '2rem' },
  box: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2rem', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' },
  boxTitle: { fontSize: '1.5rem', marginBottom: '0.5rem' },
  boxDescription: { color: '#aaa', marginBottom: '1.5rem', flexGrow: 1 },
  joinForm: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: { padding: '0.75rem', fontSize: '1.1rem', backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '4px', color: '#fff' },
  button: { padding: '0.75rem 1.5rem', fontSize: '1.1rem', cursor: 'pointer', border: 'none', borderRadius: '4px', backgroundColor: '#4a90e2', color: '#fff' },
  leaveButton: { backgroundColor: '#c94c4c' },
  error: { color: '#ff6b6b', marginTop: '1.5rem' },
  subtitle: { fontSize: '1.5rem', marginBottom: '1rem', color: '#aaa' },
  instructions: { color: '#888', fontSize: '1rem', marginBottom: '2rem', marginTop: '-0.5rem' },
  playerList: { display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '2rem', width: '100%', maxWidth: '500px' },
  playerItem: { padding: '1rem', fontSize: '1.2rem', backgroundColor: '#2a2a2a', borderRadius: '8px', width: '100%' },
  controls: { display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '1rem', alignItems: 'center', marginTop: '2rem' },
  disabledButton: { backgroundColor: '#555', opacity: 0.6, cursor: 'not-allowed' },
  browserBox: { width: '100%', marginTop: '2rem' },
  lobbyList: { display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '1rem' },
  lobbyItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' },
  lobbyInfo: { textAlign: 'left' },
  lobbyIdText: { display: 'block', fontSize: '1.1rem', fontWeight: 'bold' },
  hostName: { color: '#aaa', fontSize: '0.9rem' },
  lobbyActions: { display: 'flex', alignItems: 'center', gap: '1rem' },
  playerCount: { color: '#aaa', fontSize: '0.9rem' },
  joinButton: { padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer', border: 'none', borderRadius: '4px', backgroundColor: '#3c82f6', color: '#fff' },
};
