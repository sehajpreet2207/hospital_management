import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', gender: '', dob: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(form.phone)) return setError('Enter a valid 10-digit mobile number');
    setBusy(true);
    setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page auth-single">
      <form className="auth-card" onSubmit={submit}>
        <h1>Patient registration</h1>
        <p className="muted">Create an account to book appointments and see your reports.</p>
        {error && <div className="alert">{error}</div>}
        <div className="form-grid">
          <label className="field span-2"><span>Full name</span><input value={form.name} onChange={set('name')} required /></label>
          <label className="field"><span>Mobile number</span><input value={form.phone} onChange={set('phone')} inputMode="numeric" maxLength={10} required /></label>
          <label className="field">
            <span>Gender</span>
            <select value={form.gender} onChange={set('gender')} required>
              <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
            </select>
          </label>
          <label className="field"><span>Date of birth</span><input type="date" value={form.dob} onChange={set('dob')} max={new Date().toISOString().slice(0, 10)} /></label>
          <label className="field"><span>Email</span><input type="email" value={form.email} onChange={set('email')} required /></label>
          <label className="field span-2"><span>Password (min 6 characters)</span><input type="password" value={form.password} onChange={set('password')} minLength={6} required /></label>
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Register'}</button>
        <p className="auth-alt">Already registered? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  );
}
