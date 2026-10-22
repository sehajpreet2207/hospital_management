import { useState } from 'react';
import api from '../api';
import { useAuth } from '../auth';
import { useToast } from '../components/Toast';
import PatientForm from '../components/PatientForm';
import { Field, PageHeader } from '../components/ui';
import { DAYS } from '../utils';

function PasswordCard() {
  const toast = useToast();
  const [f, setF] = useState({ currentPassword: '', newPassword: '' });
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/password', f);
      toast('Password changed');
      setF({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast(err.message, 'error');
    }
  };
  return (
    <section className="card">
      <div className="card-head"><h2>Change password</h2></div>
      <form onSubmit={submit} className="form-grid">
        <Field label="Current password"><input type="password" value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} required /></Field>
        <Field label="New password"><input type="password" minLength={6} value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} required /></Field>
        <div className="form-actions span-2"><button className="btn">Update password</button></div>
      </form>
    </section>
  );
}

function DoctorSchedule({ doctor, onSaved }) {
  const [f, setF] = useState({ days: doctor.days, startTime: doctor.startTime, endTime: doctor.endTime, available: doctor.available, phone: doctor.phone || '' });
  const toast = useToast();
  const toggle = (d) => setF({ ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d] });
  const submit = async (e) => {
    e.preventDefault();
    if (f.startTime >= f.endTime) return toast('End time must be after start time', 'error');
    try {
      await api.put(`/doctors/${doctor._id}`, f);
      toast('Schedule updated');
      onSaved();
    } catch (err) {
      toast(err.message, 'error');
    }
  };
  return (
    <section className="card">
      <div className="card-head"><h2>OP schedule</h2></div>
      <form onSubmit={submit} className="form-grid">
        <Field label="OP days" span={2}>
          <div className="day-picker">
            {DAYS.map((d) => <button type="button" key={d} className={f.days.includes(d) ? 'on' : ''} onClick={() => toggle(d)}>{d}</button>)}
          </div>
        </Field>
        <Field label="Start"><input type="time" value={f.startTime} onChange={(e) => setF({ ...f, startTime: e.target.value })} /></Field>
        <Field label="End"><input type="time" value={f.endTime} onChange={(e) => setF({ ...f, endTime: e.target.value })} /></Field>
        <Field label="Phone"><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} maxLength={10} /></Field>
        <Field label="Booking">
          <label className="check"><input type="checkbox" checked={f.available} onChange={(e) => setF({ ...f, available: e.target.checked })} /> Accepting new appointments</label>
        </Field>
        <div className="form-actions span-2"><button className="btn btn-primary">Save schedule</button></div>
      </form>
    </section>
  );
}

export default function Profile() {
  const { user, doctor, patient, reload } = useAuth();
  const toast = useToast();
  return (
    <>
      <PageHeader title={user.role === 'doctor' ? 'My schedule' : 'My profile'} sub={user.email} />
      <div className="stack narrow">
        {doctor && <DoctorSchedule doctor={doctor} onSaved={reload} />}
        {patient && (
          <section className="card">
            <div className="card-head"><h2>Personal details</h2><span className="mono sub">{patient.patientId}</span></div>
            <PatientForm initial={patient} selfEdit onSaved={() => { toast('Profile updated'); reload(); }} />
          </section>
        )}
        <PasswordCard />
      </div>
    </>
  );
}
