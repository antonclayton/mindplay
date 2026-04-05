import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePlay = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate('/lobby');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>MindPlay</h1>
        <p style={styles.subtitle}>
          {user ? `Welcome, ${user.username}!` : 'Test your mind. Challenge yourself.'}
        </p>
        <div style={styles.buttonContainer}>
          <Button onClick={handlePlay}>Play</Button>
        </div>
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
  content: {
    textAlign: 'center',
    maxWidth: '600px',
  },
  title: {
    fontSize: '4rem',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '1rem',
    letterSpacing: '0.05em',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#aaa',
    marginBottom: '2rem',
  },
  buttonContainer: {
    maxWidth: '300px',
    margin: '0 auto',
  },
};
