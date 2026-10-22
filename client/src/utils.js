export const inr = (n) => {
  const v = Number(n || 0);
  const d = Number.isInteger(v) ? 0 : 2;
  return '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
};

export const localDate = (d = new Date()) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export const fmtDate = (d) =>
  d ? new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

export const age = (dob) => {
  if (!dob) return '-';
  const b = new Date(dob);
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--;
  return a;
};

export const initials = (name = '') =>
  name.replace(/^Dr\.\s*/, '').replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const SPECIALIZATIONS = ['General Medicine', 'Cardiology', 'Orthopaedics', 'Paediatrics', 'ENT', 'Gynaecology', 'Dermatology', 'Neurology', 'Ophthalmology', 'Psychiatry'];
