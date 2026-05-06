import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>
        <form onSubmit={handleSubmit}>
          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 73px)',
    padding: '2rem',
  },
  card: {
    backgroundColor: '#1a1a1a',
    padding: '2rem',
    borderRadius: '8px',
    border: '1px solid #333',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontSize: '2rem',
    color: '#fff',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  error: {
    color: '#ff6b6b',
    fontSize: '0.9rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  footer: {
    marginTop: '1.5rem',
    textAlign: 'center',
    color: '#aaa',
    fontSize: '0.9rem',
  },
  link: {
    color: '#4a90e2',
    textDecoration: 'none',
  },
};
