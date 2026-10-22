import { useState } from 'react';
import api from '../api';
import { useFetch } from '../hooks';
import { useToast } from '../components/Toast';
import Icon from '../components/Icon';
import { Badge, Empty, Field, Loading, Modal, PageHeader } from '../components/ui';
import { fmtDate, inr } from '../utils';

function StaffForm({ initial, onSaved }) {
  const [f, setF] = useState({ name: '', designation: '', department: '', phone: '', email: '', shift: 'Morning', salary: '', status: 'On Duty', ...initial, joinedOn: initial?.joinedOn?.slice(0, 10) || new Date().toISOString().slice(0, 10) });
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try {
      onSaved(initial?._id ? await api.put(`/staff/${initial._id}`, f) : await api.post('/staff', f));
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <form onSubmit={submit}>
      {error && <div className="alert">{error}</div>}
      <div className="form-grid">
        <Field label="Name"><input value={f.name} onChange={set('name')} required /></Field>
        <Field label="Designation"><input value={f.designation} onChange={set('designation')} placeholder="Staff Nurse" required /></Field>
        <Field label="Department"><input value={f.department} onChange={set('department')} placeholder="General Ward" /></Field>
        <Field label="Phone"><input value={f.phone} onChange={set('phone')} maxLength={10} /></Field>
        <Field label="Shift">
          <select value={f.shift} onChange={set('shift')}><option>Morning</option><option>Evening</option><option>Night</option></select>
        </Field>
        <Field label="Status">
          <select value={f.status} onChange={set('status')}><option>On Duty</option><option>On Leave</option><option>Inactive</option></select>
        </Field>
        <Field label="Monthly salary (₹)"><input type="number" min="0" value={f.salary} onChange={set('salary')} /></Field>
        <Field label="Joined on"><input type="date" value={f.joinedOn} onChange={set('joinedOn')} /></Field>
      </div>
      <div className="form-actions"><button className="btn btn-primary">Save</button></div>
    </form>
  );
}

export default function Staff() {
  const toast = useToast();
  const { data, loading, reload } = useFetch('/staff');
  const [editing, setEditing] = useState(null);

  const remove = async (s) => {
    if (!confirm(`Remove ${s.name}?`)) return;
    await api.del(`/staff/${s._id}`);
    toast('Staff member removed');
    reload();
  };

  return (
    <>
      <PageHeader title="Staff" sub="Nurses, technicians and support staff.">
        <button className="btn btn-primary" onClick={() => setEditing({})}><Icon name="plus" size={16} /> Add staff</button>
      </PageHeader>
      <section className="card flush">
        {loading && !data ? <Loading /> : data.length === 0 ? <Empty>No staff added.</Empty> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Name</th><th>Department</th><th>Shift</th><th className="right">Salary</th><th>Joined</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {data.map((s) => (
                <tr key={s._id}>
                  <td className="mono">{s.staffId}</td>
                  <td className="strong">{s.name}<div className="sub">{s.designation}</div></td>
                  <td>{s.department}</td>
                  <td>{s.shift}</td>
                  <td className="right mono">{s.salary ? inr(s.salary) : '-'}</td>
                  <td>{fmtDate(s.joinedOn)}</td>
                  <td><Badge>{s.status}</Badge></td>
                  <td className="right nowrap">
                    <button className="btn btn-sm btn-ghost" onClick={() => setEditing(s)}>Edit</button>
                    <button className="icon-btn" onClick={() => remove(s)} aria-label="Remove"><Icon name="trash" size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {editing && (
        <Modal title={editing._id ? `Edit ${editing.name}` : 'Add staff member'} onClose={() => setEditing(null)} wide>
          <StaffForm initial={editing._id ? editing : null} onSaved={() => { setEditing(null); toast('Staff saved'); reload(); }} />
        </Modal>
      )}
    </>
  );
}
