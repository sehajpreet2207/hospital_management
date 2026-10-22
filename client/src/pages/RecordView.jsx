import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { useFetch } from '../hooks';
import Icon from '../components/Icon';
import { Badge, Loading, PageHeader } from '../components/ui';
import { age, fmtDate } from '../utils';

export default function RecordView() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: r, loading, error } = useFetch(`/records/${id}`);
  if (loading && !r) return <Loading />;
  if (error) return <div className="alert">{error}</div>;
  const p = r.patient;

  return (
    <>
      <PageHeader title="Consultation record" sub={`${fmtDate(r.visitDate)} · ${r.doctor?.name}`}>
        <button className="btn" onClick={() => window.print()}><Icon name="print" size={16} /> Print</button>
      </PageHeader>
      <article className="card record-sheet">
        <header className="sheet-head">
          <div>
            <div className="sheet-hosp">CarePoint Hospital</div>
            <div className="sub">Out-patient consultation</div>
          </div>
          <div className="right">
            <div className="strong">{r.doctor?.name}</div>
            <div className="sub">{r.doctor?.qualification} · {r.doctor?.specialization}</div>
          </div>
        </header>
        <div className="sheet-patient">
          <div><span className="sub">Patient</span>{user.role === 'patient' ? p.name : <Link to={`/patients/${p._id}`}>{p.name}</Link>}</div>
          <div><span className="sub">ID</span><span className="mono">{p.patientId}</span></div>
          <div><span className="sub">Age / Sex</span>{age(p.dob)} / {p.gender}</div>
          <div><span className="sub">Date</span>{fmtDate(r.visitDate)}</div>
        </div>
        {p.allergies && <div className="alert">Allergy: {p.allergies}</div>}
        <div className="vitals-row">
          {[['BP', r.vitals?.bp, 'mmHg'], ['Pulse', r.vitals?.pulse, '/min'], ['Temp', r.vitals?.temperature, '°F'], ['Weight', r.vitals?.weight, 'kg']].map(([k, v, u]) => (
            <div key={k}><span className="sub">{k}</span><strong>{v || '-'}</strong>{v && <span className="sub"> {u}</span>}</div>
          ))}
        </div>
        <section><h3>Complaints</h3><p>{r.symptoms || '-'}</p></section>
        <section><h3>Diagnosis</h3><p className="strong">{r.diagnosis}</p></section>
        <section><h3>Treatment / advice</h3><p>{r.treatment || '-'}</p></section>
        <section>
          <h3>Prescription {r.prescriptions.length > 0 && <Badge tone={r.dispensed ? 'green' : 'amber'}>{r.dispensed ? 'Issued' : 'Pending at pharmacy'}</Badge>}</h3>
          {r.prescriptions.length === 0 ? <p>No medicines.</p> : (
            <table className="table">
              <thead><tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Days</th><th>Qty</th></tr></thead>
              <tbody>
                {r.prescriptions.map((x, i) => (
                  <tr key={i}><td>{i + 1}</td><td className="strong">{x.name}</td><td>{x.dosage}</td><td>{x.days}</td><td>{x.quantity}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        {r.notes && <section><h3>Notes</h3><p>{r.notes}</p></section>}
      </article>
    </>
  );
}
