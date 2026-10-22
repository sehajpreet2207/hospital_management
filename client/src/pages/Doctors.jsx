import { useState } from 'react';
import api from '../api';
import { useAuth } from '../auth';
import { useFetch } from '../hooks';
import { useToast } from '../components/Toast';
import Icon from '../components/Icon';
import { Avatar, Badge, Empty, Field, Loading, Modal, PageHeader } from '../components/ui';
import { DAYS, fmtTime, inr, SPECIALIZATIONS } from '../utils';

function DoctorForm({ initial, onSaved }) {
  const [f, setF] = useState({
    name: '', specialization: '', qualification: '', experience: 0, phone: '', email: '', fee: 300,
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], startTime: '09:00', endTime: '13:00', available: true, loginPassword: '',
    ...initial,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const toggleDay = (d) => setF({ ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d] });

  const submit = async (e) => {
    e.preventDefault();
    if (f.startTime >= f.endTime) return setError('End time must be after start time');
    if (!f.days.length) return setError('Pick at least one OP day');
    setBusy(true);
    try {
      onSaved(initial?._id ? await api.put(`/doctors/${initial._id}`, f) : await api.post('/doctors', f));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      {error && <div className="alert">{error}</div>}
      <div className="form-grid">
        <Field label="Name"><input value={f.name} onChange={set('name')} placeholder="Dr. " required /></Field>
        <Field label="Specialization">
          <select value={f.specialization} onChange={set('specialization')} required>
            <option value="">Select</option>
            {SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Qualification"><input value={f.qualification} onChange={set('qualification')} placeholder="MBBS, MD" /></Field>
        <Field label="Experience (years)"><input type="number" min="0" value={f.experience} onChange={set('experience')} /></Field>
        <Field label="Phone"><input value={f.phone} onChange={set('phone')} maxLength={10} /></Field>
        <Field label="Email"><input type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Consultation fee (₹)"><input type="number" min="0" value={f.fee} onChange={set('fee')} required /></Field>
        <Field label="Status">
          <label className="check"><input type="checkbox" checked={f.available} onChange={set('available')} /> Available for booking</label>
        </Field>
        <Field label="OP days" span={2}>
          <div className="day-picker">
            {DAYS.map((d) => (
              <button type="button" key={d} className={f.days.includes(d) ? 'on' : ''} onClick={() => toggleDay(d)}>{d}</button>
            ))}
          </div>
        </Field>
        <Field label="OP start"><input type="time" value={f.startTime} onChange={set('startTime')} required /></Field>
        <Field label="OP end"><input type="time" value={f.endTime} onChange={set('endTime')} required /></Field>
        {!initial?._id && (
          <Field label="Login password (optional, creates a doctor account)" span={2}>
            <input type="text" value={f.loginPassword} onChange={set('loginPassword')} minLength={6} placeholder="Leave empty to add without login" />
          </Field>
        )}
      </div>
      <div className="form-actions"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save doctor'}</button></div>
    </form>
  );
}

export default function Doctors() {
  const { user } = useAuth();
  const toast = useToast();
  const [spec, setSpec] = useState('');
  const { data, loading, reload } = useFetch(`/doctors${spec ? `?specialization=${encodeURIComponent(spec)}` : ''}`);
  const [editing, setEditing] = useState(null);
  const isAdmin = user.role === 'admin';

  const remove = async (d) => {
    if (!confirm(`Remove ${d.name}?`)) return;
    try {
      await api.del(`/doctors/${d._id}`);
      toast('Doctor removed');
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <>
      <PageHeader title="Doctors" sub="Consultants on the hospital panel and their OP timings.">
        {isAdmin && <button className="btn btn-primary" onClick={() => setEditing({})}><Icon name="plus" size={16} /> Add doctor</button>}
      </PageHeader>
      <div className="toolbar">
        <select value={spec} onChange={(e) => setSpec(e.target.value)} aria-label="Filter by department">
          <option value="">All departments</option>
          {SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      {loading && !data ? <Loading /> : data.length === 0 ? <Empty>No doctors in this department.</Empty> : (
        <div className="doctor-grid">
          {data.map((d) => (
            <article className="card doctor-card" key={d._id}>
              <div className="doctor-top">
                <Avatar name={d.name} size={48} />
                <div className="grow">
                  <div className="strong">{d.name}</div>
                  <div className="sub">{d.qualification}</div>
                </div>
                <Badge tone={d.available ? 'green' : 'grey'}>{d.available ? 'Available' : 'Away'}</Badge>
              </div>
              <div className="doctor-spec">{d.specialization}<span className="sub"> · {d.experience} yrs</span></div>
              <dl className="facts compact">
                <dt>OP days</dt><dd>{DAYS.filter((x) => d.days.includes(x)).join(', ')}</dd>
                <dt>Timing</dt><dd>{fmtTime(d.startTime)} to {fmtTime(d.endTime)}</dd>
                <dt>Fee</dt><dd>{inr(d.fee)}</dd>
                <dt>Contact</dt><dd className="mono">{d.phone || '-'}</dd>
              </dl>
              {isAdmin && (
                <div className="card-actions">
                  <button className="btn btn-sm" onClick={() => setEditing(d)}>Edit</button>
                  <button className="btn btn-sm btn-danger-ghost" onClick={() => remove(d)}>Remove</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      {editing && (
        <Modal title={editing._id ? `Edit ${editing.name}` : 'Add doctor'} onClose={() => setEditing(null)} wide>
          <DoctorForm initial={editing._id ? editing : null} onSaved={() => { setEditing(null); toast('Doctor saved'); reload(); }} />
        </Modal>
      )}
    </>
  );
}
