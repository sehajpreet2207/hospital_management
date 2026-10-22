import { Link, useParams } from 'react-router-dom';
import { useFetch } from '../hooks';
import Icon from '../components/Icon';
import { Badge, Loading } from '../components/ui';
import { age, fmtDate, inr } from '../utils';

export default function Invoice() {
  const { id } = useParams();
  const { data: b, loading, error } = useFetch(`/bills/${id}`);
  if (loading && !b) return <Loading />;
  if (error) return <div className="alert">{error}</div>;
  const p = b.patient;

  return (
    <div className="invoice-page">
      <div className="invoice-bar no-print">
        <Link to="/billing" className="btn btn-ghost">← Back to billing</Link>
        <button className="btn btn-primary" onClick={() => window.print()}><Icon name="print" size={16} /> Print bill</button>
      </div>
      <div className="invoice">
        <header className="inv-head">
          <div>
            <div className="sheet-hosp">CarePoint Hospital</div>
            <div className="sub">No. 12, OMR Main Road, Sholinganallur, Chennai 600119</div>
          </div>
          <div className="right">
            <div className="inv-title">{b.status === 'Paid' ? 'RECEIPT' : 'BILL'}</div>
            <div className="mono strong">{b.billNo}</div>
            <div className="sub">{fmtDate(b.createdAt)}</div>
          </div>
        </header>
        <div className="sheet-patient">
          <div><span className="sub">Patient</span>{p.name}</div>
          <div><span className="sub">Patient ID</span><span className="mono">{p.patientId}</span></div>
          <div><span className="sub">Age / Sex</span>{age(p.dob)} / {p.gender}</div>
          <div><span className="sub">Consultant</span>{b.appointment?.doctor?.name || '-'}</div>
        </div>
        <table className="table inv-table">
          <thead><tr><th>#</th><th>Description</th><th>Category</th><th className="right">Qty</th><th className="right">Rate</th><th className="right">Amount</th></tr></thead>
          <tbody>
            {b.items.map((it, i) => (
              <tr key={i}>
                <td>{i + 1}</td><td>{it.description}</td><td>{it.category}</td>
                <td className="right">{it.quantity}</td><td className="right mono">{inr(it.rate)}</td>
                <td className="right mono">{inr(it.quantity * it.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="inv-totals">
          <div><span>Subtotal</span><span className="mono">{inr(b.subtotal)}</span></div>
          {b.discount > 0 && <div><span>Discount</span><span className="mono">- {inr(b.discount)}</span></div>}
          {b.taxPercent > 0 && <div><span>Tax ({b.taxPercent}%)</span><span className="mono">{inr(b.total - Math.max(b.subtotal - b.discount, 0))}</span></div>}
          <div className="grand"><span>Total</span><span className="mono">{inr(b.total)}</span></div>
        </div>
        <footer className="inv-foot">
          <div>
            Status: <Badge>{b.status}</Badge>
            {b.status === 'Paid' && <span className="sub"> · {b.paymentMethod} on {fmtDate(b.paidAt)}</span>}
          </div>
          <div className="sub">Prepared by {b.createdBy?.name || 'Billing desk'}</div>
        </footer>
        <p className="sub center">This is a computer generated bill. Get well soon.</p>
      </div>
    </div>
  );
}
