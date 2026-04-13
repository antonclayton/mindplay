import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getLeaderboard()
      .then((data) => setLeaderboard(data.leaderboard))
      .catch(() => setError('Failed to load leaderboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.message}>Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.headerIcon}>🏆</span>
          <span style={styles.headerText}>LEADERBOARD</span>
        </div>

        <p style={styles.subtitle}>Top players with 5+ games played</p>

        {leaderboard.length === 0 ? (
          <p style={styles.noData}>
            No players qualify yet. Play at least 5 games to appear here.
          </p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Player</th>
                <th style={styles.th}>Score</th>
                <th style={styles.th}>W</th>
                <th style={styles.th}>L</th>
                <th style={styles.th}>D</th>
                <th style={styles.th}>Games</th>
                <th style={styles.th}>Win %</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => {
                const isMe = user?.username === entry.username;
                return (
                  <tr
                    key={entry.username}
                    style={{
                      ...styles.row,
                      ...(isMe ? styles.myRow : {}),
                    }}
                  >
                    <td style={styles.td}>
                      {entry.rank === 1 && '🥇'}
                      {entry.rank === 2 && '🥈'}
                      {entry.rank === 3 && '🥉'}
                      {entry.rank > 3 && entry.rank}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'left', fontWeight: isMe ? 'bold' : 'normal' }}>
                      {entry.username}
                      {isMe && <span style={styles.youBadge}>you</span>}
                    </td>
                    <td style={styles.td}>{entry.score.toFixed(2)}</td>
                    <td style={{ ...styles.td, color: '#28a745' }}>{entry.wins}</td>
                    <td style={{ ...styles.td, color: '#dc3545' }}>{entry.losses}</td>
                    <td style={styles.td}>{entry.draws}</td>
                    <td style={styles.td}>{entry.totalGames}</td>
                    <td style={styles.td}>{Math.round(entry.winRate * 100)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    padding: '2rem 1rem',
    minHeight: 'calc(100vh - 73px)',
    backgroundColor: '#0a0a0a',
    color: '#fff',
  },
  card: {
    width: '100%',
    maxWidth: '800px',
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    border: '2px solid #f39c12',
    boxShadow: '0 0 20px rgba(243, 156, 18, 0.15)',
    padding: '2rem',
    alignSelf: 'flex-start',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    marginBottom: '0.75rem',
    backgroundColor: '#f39c12',
    borderRadius: '8px',
    color: '#000',
  },
  headerIcon: {
    fontSize: '1.2rem',
  },
  headerText: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    letterSpacing: '0.15rem',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    fontSize: '0.85rem',
    marginBottom: '1.5rem',
    fontStyle: 'italic',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '0.75rem 0.5rem',
    textAlign: 'center',
    fontSize: '0.8rem',
    color: '#888',
    borderBottom: '1px solid #333',
    textTransform: 'uppercase',
    letterSpacing: '0.05rem',
  },
  row: {
    borderBottom: '1px solid #222',
    transition: 'background-color 0.15s',
  },
  myRow: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    border: '1px solid rgba(74, 144, 226, 0.3)',
  },
  td: {
    padding: '0.85rem 0.5rem',
    textAlign: 'center',
    fontSize: '0.95rem',
    color: '#fff',
  },
  youBadge: {
    marginLeft: '0.5rem',
    padding: '0.1rem 0.4rem',
    backgroundColor: '#4a90e2',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    color: '#fff',
  },
  message: {
    color: '#aaa',
    fontSize: '1.1rem',
  },
  error: {
    color: '#dc3545',
    fontSize: '1.1rem',
  },
  noData: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: '2rem 0',
  },
};
