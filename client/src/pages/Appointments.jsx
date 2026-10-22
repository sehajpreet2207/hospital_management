import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth';
import { useFetch } from '../hooks';
import { useToast } from '../components/Toast';
import Icon from '../components/Icon';
import { Badge, Empty, Field, Loading, Modal, PageHeader } from '../components/ui';
import { fmtDate, fmtTime, inr, localDate } from '../utils';

function BookForm({ presetPatient, onBooked }) {
  const { user } = useAuth();
  const isStaff = user.role !== 'patient';
  const { data: doctors } = useFetch('/doctors');
  const { data: patients } = useFetch(isStaff ? '/patients' : null);
  const [f, setF] = useState({ patient: presetPatient || '', doctor: '', date: localDate(), time: '', reason: '' });
  const [slots, setSlots] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const doctor = doctors?.find((d) => d._id === f.doctor);

  useEffect(() => {
    if (!f.doctor || !f.date) return setSlots(null);
    setF((x) => ({ ...x, time: '' }));
    api.get(`/doctors/${f.doctor}/slots?date=${f.date}`).then(setSlots).catch((e) => setError(e.message));
  }, [f.doctor, f.date]);

  const submit = async (e) => {
    e.preventDefault();
    if (!f.time) return setError('Pick a time slot');
    setBusy(true);
    setError('');
    try {
      onBooked(await api.post('/appointments', f));
    } catch (err) {
      setError(err.message);
      setBusy(false);
      api.get(`/doctors/${f.doctor}/slots?date=${f.date}`).then(setSlots);
    }
  };

  return (
    <form onSubmit={submit}>
      {error && <div className="alert">{error}</div>}
      <div className="form-grid">
        {isStaff && (
          <Field label="Patient" span={2}>
            <select value={f.patient} onChange={(e) => setF({ ...f, patient: e.target.value })} required>
              <option value="">Select patient</option>
              {patients?.slice().sort((a, b) => a.name.localeCompare(b.name)).map((p) => <option key={p._id} value={p._id}>{p.name} ({p.patientId}, {p.phone})</option>)}
            </select>
          </Field>
        )}
        <Field label="Doctor" span={2}>
          <select value={f.doctor} onChange={(e) => setF({ ...f, doctor: e.target.value })} required>
            <option value="">Select doctor</option>
            {doctors?.filter((d) => d.available).map((d) => (
              <option key={d._id} value={d._id}>{d.name} · {d.specialization} · {inr(d.fee)}</option>
            ))}
          </select>
        </Field>
        <Field label="Date"><input type="date" value={f.date} min={localDate()} onChange={(e) => setF({ ...f, date: e.target.value })} required /></Field>
        <Field label="Reason for visit"><input value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="e.g. Fever, follow-up" /></Field>
      </div>

      {doctor && <p className="muted small">OP days: {doctor.days.join(', ')} · {fmtTime(doctor.startTime)} to {fmtTime(doctor.endTime)}</p>}
      {slots && (
        slots.slots.length === 0 ? <div className="alert alert-info">{slots.message}</div> : (
          <>
            <div className="field-label">Available slots on {fmtDate(f.date)} ({slots.day})</div>
            <div className="slots">
              {slots.slots.map((s) => (
                <button type="button" key={s.time} disabled={!s.free} className={f.time === s.time ? 'on' : ''} onClick={() => setF({ ...f, time: s.time })}>
                  {fmtTime(s.time)}
                </button>
              ))}
            </div>
          </>
        )
      )}
      <div className="form-actions"><button className="btn btn-primary" disabled={busy || !f.time}>{busy ? 'Booking…' : 'Confirm booking'}</button></div>
    </form>
  );
}

export default function Appointments() {
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState(user.role === 'patient' ? 'upcoming' : 'today');
  const [date, setDate] = useState(localDate());
  const [status, setStatus] = useState('');

  let url = '/appointments?';
  if (view === 'today') url += `date=${localDate()}`;
  if (view === 'date') url += `date=${date}`;
  if (view === 'upcoming') url += 'upcoming=1';
  if (status) url += `&status=${status}`;
  const { data, loading, reload } = useFetch(url);
  const booking = params.get('new');

  const closeBooking = () => setParams({});

  const changeStatus = async (a, s) => {
    if (s === 'Cancelled' && !confirm('Cancel this appointment?')) return;
    try {
      await api.patch(`/appointments/${a._id}/status`, { status: s });
      toast(`Appointment ${s.toLowerCase()}`);
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const canBook = user.role !== 'doctor';

  return (
    <>
      <PageHeader title={user.role === 'admin' || user.role === 'receptionist' ? 'Appointments' : 'My appointments'}>
        {canBook && <button className="btn btn-primary" onClick={() => setParams({ new: '1' })}><Icon name="plus" size={16} /> Book appointment</button>}
      </PageHeader>

      <div className="toolbar">
        <div className="seg">
          {[['today', 'Today'], ['upcoming', 'Upcoming'], ['date', 'By date'], ['all', 'All']].map(([k, l]) => (
            <button key={k} className={view === k ? 'on' : ''} onClick={() => setView(k)}>{l}</button>
          ))}
        </div>
        {view === 'date' && <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />}
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">Any status</option><option>Scheduled</option><option>Completed</option><option>Cancelled</option>
        </select>
      </div>

      <section className="card flush">
        {loading && !data ? <Loading /> : data.length === 0 ? <Empty>No appointments for this view.</Empty> : (
          <table className="table">
            <thead>
              <tr>
                <th>Date &amp; time</th>
                {user.role !== 'patient' && <th>Patient</th>}
                {user.role !== 'doctor' && <th>Doctor</th>}
                <th>Reason</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a._id}>
                  <td>{fmtDate(a.date)}<div className="sub mono">{fmtTime(a.time)}</div></td>
                  {user.role !== 'patient' && (
                    <td><Link to={`/patients/${a.patient?._id}`}>{a.patient?.name}</Link><div className="sub">{a.patient?.patientId} · {a.patient?.phone}</div></td>
                  )}
                  {user.role !== 'doctor' && <td>{a.doctor?.name}<div className="sub">{a.doctor?.specialization}</div></td>}
                  <td>{a.reason || '-'}</td>
                  <td><Badge>{a.status}</Badge></td>
                  <td className="right nowrap">
                    {a.status === 'Scheduled' && user.role === 'doctor' && <Link className="btn btn-sm btn-primary" to={`/records?new=${a._id}`}>Consult</Link>}
                    {a.status === 'Scheduled' && ['admin', 'receptionist'].includes(user.role) && a.date <= localDate() && (
                      <button className="btn btn-sm" onClick={() => changeStatus(a, 'Completed')}>Mark done</button>
                    )}
                    {a.status === 'Scheduled' && <button className="btn btn-sm btn-danger-ghost" onClick={() => changeStatus(a, 'Cancelled')}>Cancel</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {booking && canBook && (
        <Modal title="Book appointment" onClose={closeBooking} wide>
          <BookForm
            presetPatient={params.get('patient')}
            onBooked={(a) => {
              closeBooking();
              toast(`Booked with ${a.doctor.name} on ${fmtDate(a.date)} at ${fmtTime(a.time)}`);
              reload();
            }}
          />
        </Modal>
      )}
    </>
  );
}
