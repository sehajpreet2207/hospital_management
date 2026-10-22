import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth';
import { useFetch } from '../hooks';
import { useToast } from '../components/Toast';
import { Badge, Empty, Field, Loading, Modal, PageHeader } from '../components/ui';
import { age, fmtDate } from '../utils';

function ConsultForm({ appointment, onSaved }) {
  const { data: medicines } = useFetch('/medicines');
  const { data: history } = useFetch(`/records?patient=${appointment.patient._id}`);
  const [f, setF] = useState({ symptoms: appointment.reason || '', diagnosis: '', treatment: '', notes: '', vitals: { bp: '', pulse: '', temperature: '', weight: '' } });
  const [rx, setRx] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setV = (k) => (e) => setF({ ...f, vitals: { ...f.vitals, [k]: e.target.value } });

  const addRx = () => setRx([...rx, { medicine: '', name: '', dosage: '1-0-1', days: 5, quantity: 10 }]);
  const updRx = (i, k, v) => setRx(rx.map((r, j) => {
    if (j !== i) return r;
    const next = { ...r, [k]: v };
    if (k === 'medicine') next.name = medicines.find((m) => m._id === v)?.name || '';
    // quantity follows dosage x days when the dosage is in 1-0-1 form
    if ((k === 'dosage' || k === 'days') && /^\d-\d-\d$/.test(next.dosage)) {
      next.quantity = next.dosage.split('-').reduce((s, n) => s + Number(n), 0) * Number(next.days || 0);
    }
    return next;
  }));

  const submit = async (e) => {
    e.preventDefault();
    if (rx.some((r) => !r.medicine)) return setError('Select a medicine for every prescription row, or remove the empty row');
    setBusy(true);
    try {
      onSaved(await api.post('/records', { ...f, patient: appointment.patient._id, appointment: appointment._id, prescriptions: rx }));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const p = appointment.patient;
  return (
    <form onSubmit={submit}>
      <div className="consult-head">
        <div><span className="strong">{p.name}</span> <span className="sub">{p.patientId} · {age(p.dob)} yrs · {p.gender}</span></div>
        {history?.length > 0 && <span className="sub">Last visit: {history[0].diagnosis} ({fmtDate(history[0].visitDate)})</span>}
      </div>
      {error && <div className="alert">{error}</div>}
      <div className="vitals">
        <Field label="BP (mmHg)"><input value={f.vitals.bp} onChange={setV('bp')} placeholder="120/80" /></Field>
        <Field label="Pulse (/min)"><input value={f.vitals.pulse} onChange={setV('pulse')} placeholder="72" /></Field>
        <Field label="Temp (°F)"><input value={f.vitals.temperature} onChange={setV('temperature')} placeholder="98.6" /></Field>
        <Field label="Weight (kg)"><input value={f.vitals.weight} onChange={setV('weight')} /></Field>
      </div>
      <div className="form-grid">
        <Field label="Symptoms / complaints" span={2}><textarea rows={2} value={f.symptoms} onChange={set('symptoms')} /></Field>
        <Field label="Diagnosis" span={2}><input value={f.diagnosis} onChange={set('diagnosis')} required /></Field>
        <Field label="Treatment / advice" span={2}><textarea rows={2} value={f.treatment} onChange={set('treatment')} /></Field>
      </div>

      <div className="rx-head">
        <span className="field-label">Prescription</span>
        <button type="button" className="btn btn-sm" onClick={addRx}>Add medicine</button>
      </div>
      {rx.length === 0 ? <p className="muted small">No medicines prescribed.</p> : (
        <table className="table rx-table">
          <thead><tr><th>Medicine</th><th>Dosage</th><th>Days</th><th>Qty</th><th></th></tr></thead>
          <tbody>
            {rx.map((r, i) => (
              <tr key={i}>
                <td>
                  <select value={r.medicine} onChange={(e) => updRx(i, 'medicine', e.target.value)} aria-label="Medicine">
                    <option value="">Select</option>
                    {medicines?.map((m) => <option key={m._id} value={m._id}>{m.name} ({m.stock} in stock)</option>)}
                  </select>
                </td>
                <td><input value={r.dosage} onChange={(e) => updRx(i, 'dosage', e.target.value)} aria-label="Dosage" /></td>
                <td><input type="number" min="1" value={r.days} onChange={(e) => updRx(i, 'days', e.target.value)} aria-label="Days" /></td>
                <td><input type="number" min="1" value={r.quantity} onChange={(e) => updRx(i, 'quantity', Number(e.target.value))} aria-label="Quantity" /></td>
                <td><button type="button" className="icon-btn" onClick={() => setRx(rx.filter((_, j) => j !== i))} aria-label="Remove">×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="form-grid"><Field label="Notes / review advice" span={2}><input value={f.notes} onChange={set('notes')} placeholder="e.g. Review after one week" /></Field></div>
      <div className="form-actions"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save and complete visit'}</button></div>
    </form>
  );
}

export default function Records() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [mine, setMine] = useState(user.role === 'doctor');
  const { data, loading, reload } = useFetch(`/records${mine ? '?mine=1' : ''}`);
  const [appt, setAppt] = useState(null);
  const newFor = params.get('new');

  useEffect(() => {
    if (!newFor) return setAppt(null);
    api.get('/appointments?status=Scheduled').then((list) => {
      const a = list.find((x) => x._id === newFor);
      if (a) setAppt(a);
      else { toast('Appointment not found or already completed', 'error'); setParams({}); }
    });
  }, [newFor]);

  return (
    <>
      <PageHeader title={user.role === 'patient' ? 'My medical records' : 'Medical records'} sub="Consultation notes, diagnosis and prescriptions." />
      {user.role === 'doctor' && (
        <div className="toolbar">
          <div className="seg">
            <button className={mine ? 'on' : ''} onClick={() => setMine(true)}>My consultations</button>
            <button className={!mine ? 'on' : ''} onClick={() => setMine(false)}>All records</button>
          </div>
        </div>
      )}
      <section className="card flush">
        {loading && !data ? <Loading /> : data.length === 0 ? <Empty>No records yet.</Empty> : (
          <table className="table">
            <thead>
              <tr><th>Visit date</th>{user.role !== 'patient' && <th>Patient</th>}<th>Doctor</th><th>Diagnosis</th><th>Medicines</th></tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r._id} className="clickable" onClick={() => navigate(`/records/${r._id}`)}>
                  <td>{fmtDate(r.visitDate)}</td>
                  {user.role !== 'patient' && <td>{r.patient?.name}<div className="sub">{r.patient?.patientId}</div></td>}
                  <td>{r.doctor?.name}<div className="sub">{r.doctor?.specialization}</div></td>
                  <td><Link to={`/records/${r._id}`} onClick={(e) => e.stopPropagation()}>{r.diagnosis}</Link></td>
                  <td>{r.prescriptions.length ? <Badge tone={r.dispensed ? 'green' : 'amber'}>{r.prescriptions.length} · {r.dispensed ? 'Issued' : 'Pending'}</Badge> : <span className="sub">None</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {appt && (
        <Modal title="Consultation" onClose={() => setParams({})} wide>
          <ConsultForm appointment={appt} onSaved={(r) => { setParams({}); toast('Visit saved and marked completed'); reload(); navigate(`/records/${r._id}`); }} />
        </Modal>
      )}
    </>
  );
}
