import { useEffect } from 'react';
import { initials } from '../utils';

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function PageHeader({ title, sub, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}

const STATUS_CLASS = {
  Scheduled: 'blue', Completed: 'green', Cancelled: 'grey',
  Paid: 'green', Unpaid: 'amber',
  'On Duty': 'green', 'On Leave': 'amber', Inactive: 'grey',
  Issued: 'green', Pending: 'amber',
};

export const Badge = ({ children, tone }) => (
  <span className={`badge badge-${tone || STATUS_CLASS[children] || 'grey'}`}>{children}</span>
);

export const Avatar = ({ name, size = 32 }) => (
  <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials(name)}</span>
);

export const Empty = ({ children }) => <div className="empty">{children}</div>;

export const Loading = () => <div className="loading">Loading…</div>;

export function Field({ label, children, span }) {
  return (
    <label className={`field ${span ? `span-${span}` : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Stat({ label, value, note, tone }) {
  return (
    <div className={`stat ${tone ? `stat-${tone}` : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  );
}
