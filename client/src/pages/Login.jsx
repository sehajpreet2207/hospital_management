import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

const DEMO = [
  ['Admin', 'admin@hms.com', 'admin123'],
  ['Front Desk', 'reception@hms.com', 'reception123'],
  ['Doctor', 'ramesh@hms.com', 'doctor123'],
  ['Patient', 'riyash@hms.com', 'patient123'],
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-side">
        <div className="brand brand-light">
          <span className="brand-mark">
            <svg viewBox="0 0 32 32" width="34" height="34"><rect width="32" height="32" rx="7" fill="#fff" /><path d="M13 7h6v6h6v6h-6v6h-6v-6H7v-6h6z" fill="#0f766e" /></svg>
          </span>
          <div>
            <div className="brand-name">CarePoint</div>
            <div className="brand-sub">Hospital Management System</div>
          </div>
        </div>
        <div className="auth-copy">
          <h2>Patient records, appointments and billing in one place.</h2>
          <ul>
            <li>OP registration and doctor scheduling</li>
            <li>Consultation notes and prescriptions</li>
            <li>Pharmacy stock and automatic billing</li>
          </ul>
        </div>
      </div>

      <div className="auth-main">
        <form className="auth-card" onSubmit={submit}>
          <h1>Sign in</h1>
          <p className="muted">Use your hospital account to continue.</p>
          {error && <div className="alert">{error}</div>}
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </label>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          <p className="auth-alt">New patient? <Link to="/register">Create an account</Link></p>

          <div className="demo">
            <div className="demo-title">Demo accounts</div>
            <div className="demo-grid">
              {DEMO.map(([label, e, p]) => (
                <button type="button" key={e} className="demo-btn" onClick={() => { setEmail(e); setPassword(p); }}>
                  <strong>{label}</strong>
                  <span>{e}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
