import { useState } from 'react';
import api from '../api';
import { useAuth } from '../auth';
import { useFetch } from '../hooks';
import { useToast } from '../components/Toast';
import Icon from '../components/Icon';
import { Badge, Field, Loading, Modal, PageHeader } from '../components/ui';
import { fmtDate } from '../utils';

const ROLE_TONE = { admin: 'red', receptionist: 'blue', doctor: 'green', patient: 'grey' };
const ROLE_LABEL = { admin: 'Admin', receptionist: 'Front desk', doctor: 'Doctor', patient: 'Patient' };

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const { data, loading, reload } = useFetch('/users');
  const { data: doctors } = useFetch('/doctors');
  const [role, setRole] = useState('');
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'receptionist', doctorRef: '' });
  const [error, setError] = useState('');

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', f);
      toast(`Account created for ${f.name}`);
      setAdding(false);
      setF({ name: '', email: '', password: '', role: 'receptionist', doctorRef: '' });
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggle = async (u) => {
    try {
      await api.patch(`/users/${u._id}`, { active: !u.active });
      toast(`${u.name} ${u.active ? 'disabled' : 'enabled'}`);
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const resetPw = async (u) => {
    const pw = prompt(`New password for ${u.name} (min 6 characters)`);
    if (!pw) return;
    if (pw.length < 6) return toast('Password too short', 'error');
    await api.patch(`/users/${u._id}`, { password: pw });
    toast('Password reset');
  };

  const list = (data || []).filter((u) => !role || u.role === role);
  const unlinkedDoctors = doctors?.filter((d) => !d.user) || [];

  return (
    <>
      <PageHeader title="User accounts" sub="Who can log in, and with which role.">
        <button className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> New account</button>
      </PageHeader>
      <div className="toolbar">
        <div className="seg">
          {[['', 'All'], ['admin', 'Admin'], ['receptionist', 'Front desk'], ['doctor', 'Doctors'], ['patient', 'Patients']].map(([k, l]) => (
            <button key={l} className={role === k ? 'on' : ''} onClick={() => setRole(k)}>{l}</button>
          ))}
        </div>
      </div>
      <section className="card flush">
        {loading && !data ? <Loading /> : (
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u._id}>
                  <td className="strong">{u.name}{u._id === me._id && <span className="sub"> (you)</span>}</td>
                  <td>{u.email}</td>
                  <td><Badge tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</Badge></td>
                  <td>{fmtDate(u.createdAt)}</td>
                  <td><Badge tone={u.active ? 'green' : 'grey'}>{u.active ? 'Active' : 'Disabled'}</Badge></td>
                  <td className="right nowrap">
                    <button className="btn btn-sm btn-ghost" onClick={() => resetPw(u)}>Reset password</button>
                    {u._id !== me._id && <button className="btn btn-sm" onClick={() => toggle(u)}>{u.active ? 'Disable' : 'Enable'}</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {adding && (
        <Modal title="New login account" onClose={() => setAdding(false)}>
          <form onSubmit={create}>
            {error && <div className="alert">{error}</div>}
            <Field label="Role">
              <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
                <option value="receptionist">Front desk</option><option value="doctor">Doctor</option>
                <option value="admin">Admin</option><option value="patient">Patient</option>
              </select>
            </Field>
            {f.role === 'doctor' && (
              <Field label="Link to doctor profile">
                <select value={f.doctorRef} onChange={(e) => {
                  const d = doctors.find((x) => x._id === e.target.value);
                  setF({ ...f, doctorRef: e.target.value, name: d?.name || f.name, email: d?.email || f.email });
                }} required>
                  <option value="">Select doctor</option>
                  {unlinkedDoctors.map((d) => <option key={d._id} value={d._id}>{d.name} ({d.specialization})</option>)}
                </select>
              </Field>
            )}
            <Field label="Name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
            <Field label="Email"><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></Field>
            <Field label="Password"><input type="text" minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></Field>
            <div className="form-actions"><button className="btn btn-primary">Create account</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
