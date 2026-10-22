import { useState } from 'react';
import api from '../api';
import { Field } from './ui';
import { BLOOD_GROUPS } from '../utils';

export default function PatientForm({ initial, onSaved, selfEdit }) {
  const [f, setF] = useState(() => ({
    name: '', gender: '', phone: '', email: '', bloodGroup: '', address: '', allergies: '',
    ...initial,
    dob: initial?.dob ? initial.dob.slice(0, 10) : '',
    emergencyContact: { name: '', phone: '', ...(initial?.emergencyContact || {}) },
  }));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setEc = (k) => (e) => setF({ ...f, emergencyContact: { ...f.emergencyContact, [k]: e.target.value } });

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(f.phone)) return setError('Enter a valid 10-digit mobile number');
    setBusy(true);
    try {
      const url = selfEdit ? '/patients/me' : initial?._id ? `/patients/${initial._id}` : '/patients';
      const saved = initial?._id || selfEdit ? await api.put(url, f) : await api.post(url, f);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      {error && <div className="alert">{error}</div>}
      <div className="form-grid">
        <Field label="Full name" span={2}><input value={f.name} onChange={set('name')} required /></Field>
        <Field label="Gender">
          <select value={f.gender} onChange={set('gender')} required>
            <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
          </select>
        </Field>
        <Field label="Date of birth"><input type="date" value={f.dob} onChange={set('dob')} max={new Date().toISOString().slice(0, 10)} /></Field>
        <Field label="Mobile"><input value={f.phone} onChange={set('phone')} inputMode="numeric" maxLength={10} required /></Field>
        <Field label="Email"><input type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Blood group">
          <select value={f.bloodGroup} onChange={set('bloodGroup')}>
            <option value="">Not known</option>
            {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Known allergies"><input value={f.allergies} onChange={set('allergies')} placeholder="None" /></Field>
        <Field label="Address" span={2}><textarea rows={2} value={f.address} onChange={set('address')} /></Field>
        <Field label="Emergency contact name"><input value={f.emergencyContact.name} onChange={setEc('name')} /></Field>
        <Field label="Emergency contact phone"><input value={f.emergencyContact.phone} onChange={setEc('phone')} inputMode="numeric" maxLength={10} /></Field>
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : initial?._id || selfEdit ? 'Save changes' : 'Register patient'}</button>
      </div>
    </form>
  );
}
