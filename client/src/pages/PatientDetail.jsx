import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth';
import { useFetch } from '../hooks';
import { useToast } from '../components/Toast';
import PatientForm from '../components/PatientForm';
import { Avatar, Badge, Empty, Loading, Modal, PageHeader } from '../components/ui';
import { age, fmtDate, fmtTime, inr } from '../utils';

export default function PatientDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch(`/patients/${id}`);
  const [tab, setTab] = useState('visits');
  const [editing, setEditing] = useState(false);

  if (loading && !data) return <Loading />;
  if (error) return <div className="alert">{error}</div>;
  const { patient: p, appointments, records, bills } = data;
  const canEdit = ['admin', 'receptionist'].includes(user.role);
  const due = bills.filter((b) => b.status === 'Unpaid').reduce((s, b) => s + b.total, 0);

  const remove = async () => {
    if (!confirm(`Remove ${p.name} from the system?`)) return;
    try {
      await api.del(`/patients/${p._id}`);
      toast('Patient removed');
      navigate('/patients');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <>
      <PageHeader title={p.name} sub={`${p.patientId} · registered ${fmtDate(p.createdAt)}`}>
        {canEdit && <Link className="btn btn-primary" to={`/appointments?new=1&patient=${p._id}`}>Book appointment</Link>}
        {canEdit && <button className="btn" onClick={() => setEditing(true)}>Edit details</button>}
        {user.role === 'admin' && <button className="btn btn-danger-ghost" onClick={remove}>Delete</button>}
      </PageHeader>

      <div className="profile-grid">
        <section className="card">
          <div className="profile-top">
            <Avatar name={p.name} size={56} />
            <div>
              <div className="strong">{p.name}</div>
              <div className="sub">{age(p.dob)} yrs · {p.gender}</div>
            </div>
          </div>
          <dl className="facts">
            <dt>Blood group</dt><dd>{p.bloodGroup || 'Not recorded'}</dd>
            <dt>Mobile</dt><dd className="mono">{p.phone}</dd>
            <dt>Email</dt><dd>{p.email || '-'}</dd>
            <dt>Date of birth</dt><dd>{fmtDate(p.dob)}</dd>
            <dt>Address</dt><dd>{p.address || '-'}</dd>
            <dt>Allergies</dt><dd>{p.allergies ? <Badge tone="red">{p.allergies}</Badge> : 'None known'}</dd>
            <dt>Emergency</dt><dd>{p.emergencyContact?.name ? `${p.emergencyContact.name}, ${p.emergencyContact.phone}` : '-'}</dd>
            {user.role !== 'doctor' && <><dt>Amount due</dt><dd className={due ? 'text-amber strong' : ''}>{inr(due)}</dd></>}
          </dl>
        </section>

        <section className="card flush">
          <div className="tabs">
            <button className={tab === 'visits' ? 'active' : ''} onClick={() => setTab('visits')}>Medical history ({records.length})</button>
            <button className={tab === 'appts' ? 'active' : ''} onClick={() => setTab('appts')}>Appointments ({appointments.length})</button>
            {user.role !== 'doctor' && <button className={tab === 'bills' ? 'active' : ''} onClick={() => setTab('bills')}>Bills ({bills.length})</button>}
          </div>

          {tab === 'visits' && (records.length === 0 ? <Empty>No consultations recorded yet.</Empty> : (
            <div className="timeline">
              {records.map((r) => (
                <Link to={`/records/${r._id}`} key={r._id} className="tl-item">
                  <div className="tl-date">{fmtDate(r.visitDate)}</div>
                  <div className="tl-body">
                    <div className="strong">{r.diagnosis}</div>
                    <div className="sub">{r.doctor?.name} · {r.doctor?.specialization}</div>
                    {r.prescriptions.length > 0 && <div className="sub">Rx: {r.prescriptions.map((x) => x.name).join(', ')}</div>}
                  </div>
                </Link>
              ))}
            </div>
          ))}

          {tab === 'appts' && (appointments.length === 0 ? <Empty>No appointments.</Empty> : (
            <table className="table">
              <thead><tr><th>Date</th><th>Doctor</th><th>Reason</th><th>Status</th></tr></thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a._id}>
                    <td>{fmtDate(a.date)}<div className="sub mono">{fmtTime(a.time)}</div></td>
                    <td>{a.doctor?.name}<div className="sub">{a.doctor?.specialization}</div></td>
                    <td>{a.reason || '-'}</td>
                    <td><Badge>{a.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

          {tab === 'bills' && (bills.length === 0 ? <Empty>No bills.</Empty> : (
            <table className="table">
              <thead><tr><th>Bill no</th><th>Date</th><th>Items</th><th className="right">Amount</th><th>Status</th></tr></thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b._id}>
                    <td className="mono"><Link to={`/bills/${b._id}/print`}>{b.billNo}</Link></td>
                    <td>{fmtDate(b.createdAt)}</td>
                    <td className="sub">{b.items.map((i) => i.category).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</td>
                    <td className="right mono">{inr(b.total)}</td>
                    <td><Badge>{b.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </section>
      </div>

      {editing && (
        <Modal title="Edit patient details" onClose={() => setEditing(false)} wide>
          <PatientForm initial={p} onSaved={() => { setEditing(false); toast('Patient details updated'); reload(); }} />
        </Modal>
      )}
    </>
  );
}
