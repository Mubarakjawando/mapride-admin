import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { API_BASE_URL } from '../constants/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const [shuttles, setShuttles] = useState([]);
  const [loadingShuttles, setLoadingShuttles] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [plateNumber, setPlateNumber] = useState('');
  const [capacity, setCapacity] = useState('');
  const [shuttleMessage, setShuttleMessage] = useState(null);

  const [driverName, setDriverName] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverPassword, setDriverPassword] = useState('');
  const [driverShuttleId, setDriverShuttleId] = useState('');
  const [driverMessage, setDriverMessage] = useState(null);

  const fetchShuttles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/shuttles`);
      const data = await response.json();
      setShuttles(data);
    } catch (err) {
      console.error('Failed to load shuttles:', err);
    } finally {
      setLoadingShuttles(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;
      const response = await fetch(`${API_BASE_URL}/api/auth/drivers`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load drivers:', err);
    }
  };

 const fetchReports = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/emergency`);
      const data = await response.json();
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      fetchShuttles();
      fetchDrivers();
      fetchReports();
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchShuttles();
      fetchDrivers();
      fetchReports();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (reportId) => {
    try {
      await fetch(`${API_BASE_URL}/api/emergency/${reportId}/resolve`, {
        method: 'PATCH',
      });
      fetchReports();
    } catch (err) {
      console.error('Failed to resolve report:', err);
    }
  };

  const handleCreateShuttle = async (e) => {
    e.preventDefault();
    setShuttleMessage(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/shuttles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ plateNumber, capacity: Number(capacity) }),
      });
      const data = await response.json();

      if (!response.ok) {
        setShuttleMessage(data.error || 'Failed to register shuttle');
        return;
      }

      setShuttleMessage('Shuttle registered');
      setPlateNumber('');
      setCapacity('');
      fetchShuttles();
    } catch (err) {
      console.error('Create shuttle failed:', err);
      setShuttleMessage('Could not reach the server');
    }
  };

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    setDriverMessage(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/auth/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          fullName: driverName,
          email: driverEmail,
          password: driverPassword,
          role: 'driver',
          shuttleId: driverShuttleId || null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setDriverMessage(data.error || 'Failed to create driver account');
        return;
      }

      setDriverMessage('Driver account created');
      setDriverName('');
      setDriverEmail('');
      setDriverPassword('');
      setDriverShuttleId('');
      fetchShuttles();
      fetchDrivers();
    } catch (err) {
      console.error('Create driver failed:', err);
      setDriverMessage('Could not reach the server');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div style={styles.screen}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Fleet overview</h1>
          <p style={styles.subtitle}>Manage shuttles and driver accounts</p>
        </div>
        <button style={styles.logoutButton} onClick={handleLogout}>
          Log out
        </button>
      </div>

      <div style={styles.grid}>
        {/* Shuttles section */}
        <div style={styles.column}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Register a shuttle</h2>
            <form onSubmit={handleCreateShuttle}>
              <label style={styles.label}>Plate number</label>
              <input
                style={styles.input}
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                placeholder="MAP-003"
                required
              />
              <label style={styles.label}>Capacity</label>
              <input
                style={styles.input}
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="14"
                required
              />
              {shuttleMessage && <p style={styles.message}>{shuttleMessage}</p>}
              <button style={styles.button} type="submit">Register shuttle</button>
            </form>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Fleet ({shuttles.length})</h2>
            {loadingShuttles ? (
              <p style={styles.muted}>Loading...</p>
            ) : shuttles.length === 0 ? (
              <p style={styles.muted}>No shuttles registered yet.</p>
            ) : (
              <div style={styles.list}>
                {shuttles.map((s) => (
                  <div key={s.id} style={styles.listItem}>
                    <div>
                      <p style={styles.listItemTitle}>{s.plateNumber}</p>
                      <p style={styles.muted}>
                        {s.capacity} seats
                        {s.driverId
                          ? ` • Driver: ${drivers.find((d) => d.id === s.driverId)?.fullName || 'Unknown'}`
                          : ' • No driver assigned'}
                      </p>
                    </div>
                    <span
                      style={{
                        ...styles.statusPill,
                        background: s.status === 'active' ? 'var(--accent-soft)' : 'var(--surface-muted)',
                        color: s.status === 'active' ? 'var(--accent)' : 'var(--text-muted)',
                      }}
                    >
                      {s.status === 'active' ? 'Live' : 'Offline'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drivers section */}
        <div style={styles.column}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Create a driver account</h2>
            <p style={styles.muted}>
              Drivers can&apos;t self-register — accounts are created here by an admin.
            </p>
            <form onSubmit={handleCreateDriver}>
              <label style={styles.label}>Full name</label>
              <input
                style={styles.input}
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="John Doe"
                required
              />
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                value={driverEmail}
                onChange={(e) => setDriverEmail(e.target.value)}
                placeholder="driver@mapride.app"
                required
              />
              <label style={styles.label}>Temporary password</label>
              <input
                style={styles.input}
                type="password"
                value={driverPassword}
                onChange={(e) => setDriverPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <label style={styles.label}>Assign to shuttle (optional)</label>
              <select
                style={styles.input}
                value={driverShuttleId}
                onChange={(e) => setDriverShuttleId(e.target.value)}
              >
                <option value="">No shuttle assigned yet</option>
                {shuttles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.plateNumber} ({s.capacity} seats){s.driverId ? ' — already has a driver' : ''}
                  </option>
                ))}
              </select>
              {driverMessage && <p style={styles.message}>{driverMessage}</p>}
              <button style={styles.button} type="submit">Create driver</button>
            </form>
          </div>
        </div>
      </div>

      {/* Incident reports - full width section */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Incident reports ({reports.filter(r => r.status === 'open').length} open)</h2>
        {loadingReports ? (
          <p style={styles.muted}>Loading...</p>
        ) : reports.length === 0 ? (
          <p style={styles.muted}>No incident reports.</p>
        ) : (
          <div style={styles.list}>
            {reports.map((r) => (
              <div key={r.id} style={styles.listItem}>
                <div>
                  <p style={styles.listItemTitle}>{r.description}</p>
                  <p style={styles.muted}>
                    Shuttle {r.shuttleId.slice(0, 8)}... • {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
                {r.status === 'open' ? (
                  <button style={styles.resolveButton} onClick={() => handleResolve(r.id)}>
                    Mark resolved
                  </button>
                ) : (
                  <span
                    style={{
                      ...styles.statusPill,
                      background: 'var(--surface-muted)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Resolved
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  screen: { minHeight: '100vh', padding: '32px 40px' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  title: { fontFamily: 'var(--font-display)', fontSize: 26, margin: 0, color: 'var(--text-dark)' },
  subtitle: { fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', marginTop: 4 },
  logoutButton: {
    background: 'var(--background)',
    border: '1.5px solid var(--border)',
    borderRadius: 10,
    padding: '10px 18px',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 24,
    marginBottom: 24,
  },
  column: { display: 'flex', flexDirection: 'column', gap: 24 },
  card: {
    background: 'var(--background)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 24,
  },
  cardTitle: { fontFamily: 'var(--font-display)', fontSize: 18, margin: '0 0 16px', color: 'var(--text-dark)' },
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
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    color: 'var(--text-dark)',
  },
  button: {
    width: '100%',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: 13,
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
  message: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: 'var(--accent)',
    marginBottom: 12,
  },
  muted: { fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: 12,
  },
  listItemTitle: { fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, margin: 0, color: 'var(--text-dark)' },
  statusPill: {
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    fontWeight: 500,
    padding: '4px 10px',
    borderRadius: 20,
  },
  resolveButton: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 14px',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
};