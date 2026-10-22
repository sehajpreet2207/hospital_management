import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth';
import { useFetch } from '../hooks';
import { useToast } from '../components/Toast';
import Icon from '../components/Icon';
import { Badge, Empty, Field, Loading, Modal, PageHeader } from '../components/ui';
import { fmtDate, inr } from '../utils';

function MedicineForm({ initial, onSaved }) {
  const [f, setF] = useState({ name: '', category: 'Tablet', manufacturer: '', stock: 0, unitPrice: 0, reorderLevel: 20, ...initial, expiryDate: initial?.expiryDate?.slice(0, 10) || '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try {
      onSaved(initial?._id ? await api.put(`/medicines/${initial._id}`, f) : await api.post('/medicines', f));
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <form onSubmit={submit}>
      {error && <div className="alert">{error}</div>}
      <div className="form-grid">
        <Field label="Medicine name" span={2}><input value={f.name} onChange={set('name')} required /></Field>
        <Field label="Form">
          <select value={f.category} onChange={set('category')}>
            {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Inhaler', 'Powder', 'Drops'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Manufacturer"><input value={f.manufacturer} onChange={set('manufacturer')} /></Field>
        <Field label="Stock (units)"><input type="number" min="0" value={f.stock} onChange={set('stock')} required /></Field>
        <Field label="Unit price (₹)"><input type="number" min="0" step="0.01" value={f.unitPrice} onChange={set('unitPrice')} required /></Field>
        <Field label="Reorder level"><input type="number" min="0" value={f.reorderLevel} onChange={set('reorderLevel')} /></Field>
        <Field label="Expiry date"><input type="date" value={f.expiryDate} onChange={set('expiryDate')} /></Field>
      </div>
      <div className="form-actions"><button className="btn btn-primary">Save medicine</button></div>
    </form>
  );
}

export default function Pharmacy() {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('queue');
  const [q, setQ] = useState('');
  const meds = useFetch('/medicines');
  const queue = useFetch('/records?pending=1');
  const [editing, setEditing] = useState(null);
  const [restock, setRestock] = useState(null);
  const [qty, setQty] = useState(50);

  const dispense = async (r) => {
    try {
      const { bill } = await api.post(`/records/${r._id}/dispense`);
      toast(`Medicines issued. ${bill ? `${bill.billNo} raised for ${inr(bill.total)}` : ''}`);
      queue.reload();
      meds.reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const doRestock = async () => {
    try {
      await api.patch(`/medicines/${restock._id}/restock`, { quantity: Number(qty) });
      toast(`${restock.name}: +${qty} units added`);
      setRestock(null);
      meds.reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const list = (meds.data || []).filter((m) => m.name.toLowerCase().includes(q.toLowerCase()));
  const soon = new Date();
  soon.setMonth(soon.getMonth() + 3);
  const low = (meds.data || []).filter((m) => m.stock <= m.reorderLevel).length;

  return (
    <>
      <PageHeader title="Pharmacy" sub="Issue prescriptions and manage medicine stock.">
        {tab === 'stock' && <button className="btn btn-primary" onClick={() => setEditing({})}><Icon name="plus" size={16} /> Add medicine</button>}
      </PageHeader>
      <div className="toolbar">
        <div className="seg">
          <button className={tab === 'queue' ? 'on' : ''} onClick={() => setTab('queue')}>Prescription queue {queue.data?.length ? `(${queue.data.length})` : ''}</button>
          <button className={tab === 'stock' ? 'on' : ''} onClick={() => setTab('stock')}>Stock {low ? `· ${low} low` : ''}</button>
        </div>
        {tab === 'stock' && (
          <div className="search"><Icon name="search" size={16} /><input placeholder="Search medicine" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        )}
      </div>

      {tab === 'queue' && (
        <section className="card flush">
          {queue.loading && !queue.data ? <Loading /> : queue.data.length === 0 ? <Empty>No prescriptions waiting. Everything has been issued.</Empty> : (
            <table className="table">
              <thead><tr><th>Visit</th><th>Patient</th><th>Doctor</th><th>Medicines</th><th></th></tr></thead>
              <tbody>
                {queue.data.map((r) => (
                  <tr key={r._id}>
                    <td>{fmtDate(r.visitDate)}</td>
                    <td>{r.patient?.name}<div className="sub">{r.patient?.patientId}</div></td>
                    <td>{r.doctor?.name}</td>
                    <td>{r.prescriptions.map((x) => <div key={x.name}>{x.name} <span className="sub">× {x.quantity}</span></div>)}</td>
                    <td className="right nowrap">
                      <Link className="btn btn-sm btn-ghost" to={`/records/${r._id}`}>View</Link>
                      <button className="btn btn-sm btn-primary" onClick={() => dispense(r)}>Issue &amp; bill</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {tab === 'stock' && (
        <section className="card flush">
          {meds.loading && !meds.data ? <Loading /> : list.length === 0 ? <Empty>No medicines found.</Empty> : (
            <table className="table">
              <thead><tr><th>Medicine</th><th>Form</th><th className="right">Stock</th><th className="right">Unit price</th><th>Expiry</th><th></th></tr></thead>
              <tbody>
                {list.map((m) => (
                  <tr key={m._id}>
                    <td className="strong">{m.name}<div className="sub">{m.manufacturer}</div></td>
                    <td>{m.category}</td>
                    <td className="right">
                      <span className="mono">{m.stock}</span>{' '}
                      {m.stock === 0 ? <Badge tone="red">Out</Badge> : m.stock <= m.reorderLevel && <Badge tone="amber">Low</Badge>}
                    </td>
                    <td className="right mono">{inr(m.unitPrice)}</td>
                    <td>{fmtDate(m.expiryDate)} {m.expiryDate && new Date(m.expiryDate) < soon && <Badge tone="amber">Soon</Badge>}</td>
                    <td className="right nowrap">
                      <button className="btn btn-sm" onClick={() => { setQty(50); setRestock(m); }}>Restock</button>
                      <button className="btn btn-sm btn-ghost" onClick={() => setEditing(m)}>Edit</button>
                      {user.role === 'admin' && (
                        <button className="icon-btn" aria-label="Delete medicine" onClick={async () => {
                          if (!confirm(`Delete ${m.name}?`)) return;
                          await api.del(`/medicines/${m._id}`);
                          toast('Medicine removed');
                          meds.reload();
                        }}><Icon name="trash" size={15} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {editing && (
        <Modal title={editing._id ? `Edit ${editing.name}` : 'Add medicine'} onClose={() => setEditing(null)} wide>
          <MedicineForm initial={editing._id ? editing : null} onSaved={() => { setEditing(null); toast('Medicine saved'); meds.reload(); }} />
        </Modal>
      )}
      {restock && (
        <Modal title={`Restock ${restock.name}`} onClose={() => setRestock(null)}>
          <p className="muted">Current stock: {restock.stock} units</p>
          <Field label="Units received"><input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus /></Field>
          <div className="form-actions"><button className="btn btn-primary" onClick={doRestock}>Add to stock</button></div>
        </Modal>
      )}
    </>
  );
}
