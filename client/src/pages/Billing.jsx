import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth';
import { useFetch } from '../hooks';
import { useToast } from '../components/Toast';
import Icon from '../components/Icon';
import { Badge, Empty, Field, Loading, Modal, PageHeader, Stat } from '../components/ui';
import { fmtDate, inr } from '../utils';

const CATEGORIES = ['Consultation', 'Lab', 'Procedure', 'Room', 'Pharmacy', 'Other'];

function BillForm({ onSaved }) {
  const { data: patients } = useFetch('/patients');
  const [patient, setPatient] = useState('');
  const { data: appts } = useFetch(patient ? `/appointments?patient=${patient}` : null);
  const [appointment, setAppointment] = useState('');
  const [items, setItems] = useState([{ description: '', category: 'Consultation', quantity: 1, rate: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTax] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const subtotal = items.reduce((s, i) => s + Number(i.quantity) * Number(i.rate), 0);
  const total = Math.max(subtotal - Number(discount), 0) * (1 + Number(taxPercent) / 100);
  const upd = (i, k, v) => setItems(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));

  // Picking a completed visit fills the doctor's consultation fee
  const pickAppt = (id) => {
    setAppointment(id);
    const a = appts?.find((x) => x._id === id);
    if (a) setItems([{ description: `Consultation - ${a.doctor.name}`, category: 'Consultation', quantity: 1, rate: a.doctor.fee }, ...items.filter((i) => i.description && i.category !== 'Consultation')]);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (items.some((i) => !i.description || Number(i.rate) < 0)) return setError('Every item needs a description and amount');
    setBusy(true);
    try {
      onSaved(await api.post('/bills', { patient, appointment, items, discount: Number(discount), taxPercent: Number(taxPercent) }));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      {error && <div className="alert">{error}</div>}
      <div className="form-grid">
        <Field label="Patient">
          <select value={patient} onChange={(e) => { setPatient(e.target.value); setAppointment(''); }} required>
            <option value="">Select patient</option>
            {patients?.slice().sort((a, b) => a.name.localeCompare(b.name)).map((p) => <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>)}
          </select>
        </Field>
        <Field label="Against visit (optional)">
          <select value={appointment} onChange={(e) => pickAppt(e.target.value)} disabled={!patient}>
            <option value="">No linked visit</option>
            {appts?.filter((a) => a.status !== 'Cancelled').map((a) => <option key={a._id} value={a._id}>{fmtDate(a.date)} · {a.doctor?.name}</option>)}
          </select>
        </Field>
      </div>
      <table className="table rx-table">
        <thead><tr><th>Description</th><th>Category</th><th>Qty</th><th>Rate (₹)</th><th className="right">Amount</th><th></th></tr></thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td><input value={it.description} onChange={(e) => upd(i, 'description', e.target.value)} placeholder="e.g. Blood test" aria-label="Description" /></td>
              <td>
                <select value={it.category} onChange={(e) => upd(i, 'category', e.target.value)} aria-label="Category">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </td>
              <td><input type="number" min="1" value={it.quantity} onChange={(e) => upd(i, 'quantity', e.target.value)} aria-label="Quantity" /></td>
              <td><input type="number" min="0" step="0.01" value={it.rate} onChange={(e) => upd(i, 'rate', e.target.value)} aria-label="Rate" /></td>
              <td className="right mono">{inr(it.quantity * it.rate)}</td>
              <td>{items.length > 1 && <button type="button" className="icon-btn" onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label="Remove">×</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="btn btn-sm" onClick={() => setItems([...items, { description: '', category: 'Lab', quantity: 1, rate: 0 }])}>Add item</button>
      <div className="bill-totals">
        <div><span>Subtotal</span><span className="mono">{inr(subtotal)}</span></div>
        <div><span>Discount (₹)</span><input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} aria-label="Discount" /></div>
        <div><span>GST / tax (%)</span><input type="number" min="0" value={taxPercent} onChange={(e) => setTax(e.target.value)} aria-label="Tax percent" /></div>
        <div className="grand"><span>Total</span><span className="mono">{inr(Math.round(total * 100) / 100)}</span></div>
      </div>
      <div className="form-actions"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Generate bill'}</button></div>
    </form>
  );
}

export default function Billing() {
  const { user } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState('');
  const { data, loading, reload } = useFetch(`/bills${status ? `?status=${status}` : ''}`);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(null);
  const [method, setMethod] = useState('Cash');
  const isStaff = user.role !== 'patient';

  const pay = async () => {
    try {
      await api.patch(`/bills/${paying._id}/pay`, { paymentMethod: method });
      toast(`${paying.billNo} marked paid (${method})`);
      setPaying(null);
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const remove = async (b) => {
    if (!confirm(`Delete ${b.billNo}?`)) return;
    try {
      await api.del(`/bills/${b._id}`);
      toast('Bill deleted');
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const unpaid = data?.filter((b) => b.status === 'Unpaid') || [];
  const today = new Date().toDateString();
  const collectedToday = (data || []).filter((b) => b.paidAt && new Date(b.paidAt).toDateString() === today).reduce((s, b) => s + b.total, 0);

  return (
    <>
      <PageHeader title={isStaff ? 'Billing' : 'My bills'} sub={isStaff ? 'Generate bills and record payments.' : 'Pay at the hospital billing counter by cash, card or UPI.'}>
        {isStaff && <button className="btn btn-primary" onClick={() => setCreating(true)}><Icon name="plus" size={16} /> New bill</button>}
      </PageHeader>

      {data && !status && (
        <div className={`stats ${isStaff ? '' : 'stats-3'}`}>
          <Stat label="Total bills" value={data.length} />
          <Stat label="Unpaid" value={unpaid.length} tone="amber" note={inr(unpaid.reduce((s, b) => s + b.total, 0))} />
          {isStaff && <Stat label="Collected today" value={inr(collectedToday)} tone="green" />}
          <Stat label="Paid till date" value={inr(data.filter((b) => b.status === 'Paid').reduce((s, b) => s + b.total, 0))} />
        </div>
      )}

      <div className="toolbar">
        <div className="seg">
          {[['', 'All'], ['Unpaid', 'Unpaid'], ['Paid', 'Paid']].map(([k, l]) => (
            <button key={l} className={status === k ? 'on' : ''} onClick={() => setStatus(k)}>{l}</button>
          ))}
        </div>
      </div>

      <section className="card flush">
        {loading && !data ? <Loading /> : data.length === 0 ? <Empty>No bills.</Empty> : (
          <table className="table">
            <thead>
              <tr><th>Bill no</th><th>Date</th>{isStaff && <th>Patient</th>}<th>Type</th><th className="right">Amount</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {data.map((b) => (
                <tr key={b._id}>
                  <td className="mono"><Link to={`/bills/${b._id}/print`}>{b.billNo}</Link></td>
                  <td>{fmtDate(b.createdAt)}</td>
                  {isStaff && <td>{b.patient?.name}<div className="sub">{b.patient?.patientId}</div></td>}
                  <td className="sub">{[...new Set(b.items.map((i) => i.category))].join(', ')}</td>
                  <td className="right mono strong">{inr(b.total)}</td>
                  <td><Badge>{b.status}</Badge>{b.paymentMethod && <div className="sub">{b.paymentMethod}</div>}</td>
                  <td className="right nowrap">
                    <Link className="btn btn-sm btn-ghost" to={`/bills/${b._id}/print`}>View</Link>
                    {isStaff && b.status === 'Unpaid' && <button className="btn btn-sm btn-primary" onClick={() => { setMethod('Cash'); setPaying(b); }}>Collect</button>}
                    {user.role === 'admin' && b.status === 'Unpaid' && <button className="icon-btn" onClick={() => remove(b)} aria-label="Delete bill"><Icon name="trash" size={15} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {creating && (
        <Modal title="New bill" onClose={() => setCreating(false)} wide>
          <BillForm onSaved={(b) => { setCreating(false); toast(`${b.billNo} generated for ${inr(b.total)}`); reload(); }} />
        </Modal>
      )}
      {paying && (
        <Modal title={`Collect payment · ${paying.billNo}`} onClose={() => setPaying(null)}>
          <p className="pay-amount">{inr(paying.total)}</p>
          <p className="muted center">{paying.patient?.name}</p>
          <div className="seg seg-block">
            {['Cash', 'Card', 'UPI', 'Insurance'].map((m) => (
              <button key={m} className={method === m ? 'on' : ''} onClick={() => setMethod(m)}>{m}</button>
            ))}
          </div>
          <div className="form-actions"><button className="btn btn-primary" onClick={pay}>Confirm payment</button></div>
        </Modal>
      )}
    </>
  );
}
