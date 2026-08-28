import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      if (data.role !== 'admin') {
        setError('This account is not an admin.');
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
      setError('Wrong email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.screen}>
      <form style={styles.box} onSubmit={handleLogin}>
        <div style={styles.brandBlock}>
          <div style={styles.logoDot} />
          <h1 style={styles.brand}>MapRide</h1>
          <p style={styles.tagline}>Admin dashboard</p>
        </div>

        <label style={styles.label}>Email</label>
        <input
          style={styles.input}
          type="email"
          placeholder="admin@mapride.app"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label style={styles.label}>Password</label>
        <input
          style={styles.input}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  screen: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  box: {
    width: '100%',
    maxWidth: 400,
    background: 'var(--background)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 28,
  },
  brandBlock: {
    textAlign: 'center',
    marginBottom: 32,
  },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    background: 'var(--accent)',
    margin: '0 auto 12px',
  },
  brand: {
    fontFamily: 'var(--font-display)',
    fontSize: 30,
    margin: 0,
    color: 'var(--text-dark)',
  },
  tagline: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    color: 'var(--text-muted)',
    marginTop: 4,
  },
  label: {
    display: 'block',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-muted)',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    border: '1.5px solid var(--border)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    color: 'var(--text-dark)',
  },
  button: {
    width: '100%',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: 16,
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: 16,
    cursor: 'pointer',
    marginTop: 4,
  },
  error: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: 'var(--alert)',
    textAlign: 'center',
    marginBottom: 14,
  },
};