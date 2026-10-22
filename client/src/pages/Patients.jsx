import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { useFetch } from '../hooks';
import { useToast } from '../components/Toast';
import Icon from '../components/Icon';
import PatientForm from '../components/PatientForm';
import { Empty, Loading, Modal, PageHeader } from '../components/ui';
import { age, fmtDate } from '../utils';

export default function Patients() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const { data, loading, reload } = useFetch(`/patients${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  const canAdd = ['admin', 'receptionist'].includes(user.role);

  return (
    <>
      <PageHeader title="Patients" sub={data ? `${data.length} patient${data.length === 1 ? '' : 's'}${query ? ` matching "${query}"` : ' registered'}` : ''}>
        {canAdd && <button className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> New patient</button>}
      </PageHeader>

      <form className="toolbar" onSubmit={(e) => { e.preventDefault(); setQuery(q.trim()); }}>
        <div className="search">
          <Icon name="search" size={16} />
          <input placeholder="Search by name, patient ID or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className="btn">Search</button>
        {query && <button type="button" className="btn btn-ghost" onClick={() => { setQ(''); setQuery(''); }}>Clear</button>}
      </form>

      <section className="card flush">
        {loading && !data ? <Loading /> : data.length === 0 ? <Empty>No patients found.</Empty> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Name</th><th>Age / Sex</th><th>Blood</th><th>Phone</th><th>Registered</th></tr></thead>
            <tbody>
              {data.map((p) => (
                <tr key={p._id} className="clickable" onClick={() => navigate(`/patients/${p._id}`)}>
                  <td className="mono">{p.patientId}</td>
                  <td><Link to={`/patients/${p._id}`} onClick={(e) => e.stopPropagation()}>{p.name}</Link></td>
                  <td>{age(p.dob)} / {p.gender[0]}</td>
                  <td>{p.bloodGroup || '-'}</td>
                  <td className="mono">{p.phone}</td>
                  <td>{fmtDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {adding && (
        <Modal title="Register new patient" onClose={() => setAdding(false)} wide>
          <PatientForm onSaved={(p) => { setAdding(false); toast(`${p.name} registered as ${p.patientId}`); reload(); }} />
        </Modal>
      )}
    </>
  );
}
