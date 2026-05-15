import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { validateUsername, validatePassword } from '../utils/sanitize';
import { api } from '../utils/api';

export function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    const allErrors = [];
    let sanitizedUsername, validatedPassword;

    try { sanitizedUsername = validateUsername(username); }
    catch (err) { allErrors.push(err.message); }

    try { validatedPassword = validatePassword(password); }
    catch (err) { allErrors.push(err.message); }

    if (password !== confirmPassword) allErrors.push('Passwords do not match');

    if (sanitizedUsername) {
      try {
        const { available } = await api.checkUsername(sanitizedUsername);
        if (!available) allErrors.push('Username already taken');
      } catch { /* let register handle it */ }
    }

    if (allErrors.length > 0) {
      setErrors(allErrors);
      setLoading(false);
      return;
    }

    try {
      await register(sanitizedUsername, validatedPassword);
      navigate('/');
    } catch (err) {
      setErrors([err.message]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Register</h2>
        <form onSubmit={handleSubmit}>
          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choose a password"
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
          />
          {errors.length > 0 && (
            <ul style={styles.errorList}>
              {errors.map((err, i) => (
                <li key={i} style={styles.error}>{err}</li>
              ))}
            </ul>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </Button>
        </form>
        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>
            Login
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
  errorList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 1rem 0',
  },
  error: {
    color: '#ff6b6b',
    fontSize: '0.9rem',
    textAlign: 'center',
    marginBottom: '0.25rem',
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
