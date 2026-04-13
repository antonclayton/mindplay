import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export function Stats() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getMyStats()
      .then((data) => setStats(data.stats))
      .catch(() => setError('Failed to load stats.'))
      .finally(() => setLoading(false));
  }, []);

  const totalThrows = stats
    ? stats.rockThrows + stats.paperThrows + stats.scissorsThrows
    : 0;

  const throwPct = (count) =>
    totalThrows === 0 ? 0 : Math.round((count / totalThrows) * 100);

  const winRate =
    stats && stats.totalGames > 0
      ? Math.round((stats.wins / stats.totalGames) * 100)
      : 0;

  const streakColor =
    stats && stats.currentStreak > 0
      ? '#28a745'
      : stats && stats.currentStreak < 0
      ? '#dc3545'
      : '#aaa';

  const streakLabel =
    stats && stats.currentStreak > 0
      ? `${stats.currentStreak}W`
      : stats && stats.currentStreak < 0
      ? `${Math.abs(stats.currentStreak)}L`
      : '0';

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.message}>Loading stats...</p>
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
          <span style={styles.headerIcon}>📊</span>
          <span style={styles.headerText}>MY STATS</span>
        </div>

        <div style={styles.usernameBox}>
          <span style={styles.username}>@{user?.username}</span>
        </div>

        {/* Win / Loss / Draw record */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Record</h3>
          <div style={styles.recordRow}>
            <div style={styles.recordItem}>
              <span style={styles.recordLabel}>Games</span>
              <span style={styles.recordValue}>{stats.totalGames}</span>
            </div>
            <div style={styles.recordItem}>
              <span style={styles.recordLabel}>Wins</span>
              <span style={{ ...styles.recordValue, color: '#28a745' }}>{stats.wins}</span>
            </div>
            <div style={styles.recordItem}>
              <span style={styles.recordLabel}>Losses</span>
              <span style={{ ...styles.recordValue, color: '#dc3545' }}>{stats.losses}</span>
            </div>
            <div style={styles.recordItem}>
              <span style={styles.recordLabel}>Draws</span>
              <span style={styles.recordValue}>{stats.draws}</span>
            </div>
            <div style={styles.recordItem}>
              <span style={styles.recordLabel}>Win Rate</span>
              <span style={styles.recordValue}>{winRate}%</span>
            </div>
          </div>
        </div>

        {/* Streaks */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Streaks</h3>
          <div style={styles.recordRow}>
            <div style={styles.recordItem}>
              <span style={styles.recordLabel}>Current</span>
              <span style={{ ...styles.recordValue, color: streakColor }}>
                {streakLabel}
              </span>
            </div>
            <div style={styles.recordItem}>
              <span style={styles.recordLabel}>Best</span>
              <span style={{ ...styles.recordValue, color: '#4a90e2' }}>
                {stats.bestStreak}W
              </span>
            </div>
          </div>
        </div>

        {/* Move distribution */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Move Distribution</h3>
          {totalThrows === 0 ? (
            <p style={styles.noData}>No moves recorded yet.</p>
          ) : (
            <div style={styles.bars}>
              {[
                { label: '🪨 Rock', count: stats.rockThrows },
                { label: '📄 Paper', count: stats.paperThrows },
                { label: '✂️ Scissors', count: stats.scissorsThrows },
              ].map(({ label, count }) => (
                <div key={label} style={styles.barRow}>
                  <span style={styles.barLabel}>{label}</span>
                  <div style={styles.barTrack}>
                    <div
                      style={{
                        ...styles.barFill,
                        width: `${throwPct(count)}%`,
                      }}
                    />
                  </div>
                  <span style={styles.barPct}>{throwPct(count)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
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
    maxWidth: '600px',
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    border: '2px solid #4a90e2',
    boxShadow: '0 0 20px rgba(74, 144, 226, 0.15)',
    padding: '2rem',
    alignSelf: 'flex-start',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    marginBottom: '1.5rem',
    backgroundColor: '#4a90e2',
    borderRadius: '8px',
    color: '#fff',
  },
  headerIcon: {
    fontSize: '1.2rem',
  },
  headerText: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    letterSpacing: '0.15rem',
  },
  usernameBox: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  username: {
    fontSize: '1.6rem',
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '0.9rem',
    color: '#888',
    marginBottom: '1rem',
    borderBottom: '1px solid #333',
    paddingBottom: '0.5rem',
    margin: '0 0 1rem 0',
  },
  recordRow: {
    display: 'flex',
    justifyContent: 'space-around',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  recordItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
  },
  recordLabel: {
    fontSize: '0.8rem',
    color: '#888',
  },
  recordValue: {
    fontSize: '1.4rem',
    fontWeight: 'bold',
    color: '#fff',
  },
  bars: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  barRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  barLabel: {
    width: '110px',
    fontSize: '0.95rem',
  },
  barTrack: {
    flex: 1,
    height: '12px',
    backgroundColor: '#2a2a2a',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#4a90e2',
    borderRadius: '6px',
    transition: 'width 0.4s ease',
  },
  barPct: {
    width: '40px',
    textAlign: 'right',
    fontSize: '0.9rem',
    color: '#aaa',
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
    color: '#666',
    fontStyle: 'italic',
    fontSize: '0.9rem',
  },
};
