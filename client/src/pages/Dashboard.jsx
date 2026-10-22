import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { useFetch } from '../hooks';
import { Badge, Empty, Loading, PageHeader, Stat } from '../components/ui';
import { age, fmtDate, fmtTime, inr } from '../utils';

function RevenueChart({ data }) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div className="bars">
      {data.map((d) => {
        const day = new Date(`${d.date}T00:00:00`);
        return (
          <div className="bar-col" key={d.date} title={`${fmtDate(d.date)}: ${inr(d.amount)}`}>
            <div className="bar-val">{d.amount ? inr(Math.round(d.amount)) : ''}</div>
            <div className="bar-track"><div className="bar" style={{ height: `${(d.amount / max) * 100}%` }} /></div>
            <div className="bar-label">{day.toLocaleDateString('en-IN', { weekday: 'short' })}</div>
          </div>
        );
      })}
    </div>
  );
}

function DeptList({ data }) {
  const max = Math.max(...data.map((d) => d.n), 1);
  return (
    <div className="hbars">
      {data.map((d) => (
        <div className="hbar-row" key={d._id}>
          <span className="hbar-name">{d._id}</span>
          <span className="hbar-track"><span className="hbar" style={{ width: `${(d.n / max) * 100}%` }} /></span>
          <span className="hbar-n">{d.n}</span>
        </div>
      ))}
    </div>
  );
}

function StaffDashboard({ d, user }) {
  const waiting = d.today.filter((a) => a.status === 'Scheduled').length;
  return (
    <>
      <PageHeader title={`Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${user.name.split(' ')[0]}`} sub="Here is how the hospital is doing today.">
        <Link className="btn btn-primary" to="/appointments?new=1">Book appointment</Link>
      </PageHeader>
      <div className="stats">
        <Stat label="Today's appointments" value={d.today.length} note={`${waiting} waiting`} />
        <Stat label="Registered patients" value={d.patients} note={`${d.doctors} doctors on panel`} />
        <Stat label="Collected this month" value={inr(Math.round(d.revenueMonth))} tone="green" />
        <Stat label="Pending bills" value={d.unpaidCount} note={inr(Math.round(d.unpaidAmount)) + ' due'} tone="amber" />
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-head"><h2>Today's OP list</h2><Link to="/appointments">View all</Link></div>
          {d.today.length === 0 ? <Empty>No appointments today.</Empty> : (
            <table className="table">
              <thead><tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Status</th></tr></thead>
              <tbody>
                {d.today.map((a) => (
                  <tr key={a._id}>
                    <td className="mono">{fmtTime(a.time)}</td>
                    <td><Link to={`/patients/${a.patient?._id}`}>{a.patient?.name}</Link><div className="sub">{a.patient?.patientId}</div></td>
                    <td>{a.doctor?.name}<div className="sub">{a.doctor?.specialization}</div></td>
                    <td><Badge>{a.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <div className="stack">
          <section className="card">
            <div className="card-head"><h2>Collections, last 7 days</h2></div>
            <RevenueChart data={d.revenue7} />
          </section>
          <section className="card">
            <div className="card-head"><h2>Visits by department</h2><span className="muted small">last 30 days</span></div>
            <DeptList data={d.byDept} />
          </section>
          <section className="card">
            <div className="card-head"><h2>Pharmacy alerts</h2><Link to="/pharmacy">Open pharmacy</Link></div>
            {d.pendingRx > 0 && <p className="note-line"><Badge tone="blue">{d.pendingRx}</Badge> prescription{d.pendingRx > 1 ? 's' : ''} waiting to be issued</p>}
            {d.lowStock.length === 0 ? <Empty>All medicines are above reorder level.</Empty> : (
              <ul className="plain-list">
                {d.lowStock.map((m) => (
                  <li key={m._id}><span>{m.name}</span><Badge tone={m.stock === 0 ? 'red' : 'amber'}>{m.stock} left</Badge></li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function DoctorDashboard({ d, doctor }) {
  const next = d.today.find((a) => a.status === 'Scheduled');
  return (
    <>
      <PageHeader title={doctor?.name || 'Doctor'} sub={`${doctor?.specialization} · OP ${fmtTime(doctor?.startTime)} to ${fmtTime(doctor?.endTime)}`} />
      <div className="stats">
        <Stat label="Patients today" value={d.today.length} note={`${d.today.filter((a) => a.status === 'Completed').length} seen`} />
        <Stat label="Upcoming (after today)" value={d.upcomingCount} />
        <Stat label="Consultations recorded" value={d.seen} />
        <Stat label="Unique patients treated" value={d.patientCount} />
      </div>
      <section className="card">
        <div className="card-head">
          <h2>Today's patients</h2>
          {next && <Link className="btn btn-primary btn-sm" to={`/records?new=${next._id}`}>Start consultation: {next.patient?.name}</Link>}
        </div>
        {d.today.length === 0 ? <Empty>No patients booked for today.</Empty> : (
          <table className="table">
            <thead><tr><th>Time</th><th>Patient</th><th>Age / Sex</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {d.today.map((a) => (
                <tr key={a._id}>
                  <td className="mono">{fmtTime(a.time)}</td>
                  <td><Link to={`/patients/${a.patient?._id}`}>{a.patient?.name}</Link><div className="sub">{a.patient?.patientId}</div></td>
                  <td>{age(a.patient?.dob)} / {a.patient?.gender?.[0]}</td>
                  <td><Badge>{a.status}</Badge></td>
                  <td className="right">{a.status === 'Scheduled' && <Link className="btn btn-sm" to={`/records?new=${a._id}`}>Consult</Link>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

function PatientDashboard({ d, user }) {
  return (
    <>
      <PageHeader title={`Hello, ${user.name.split(' ')[0]}`} sub="Your appointments, reports and bills.">
        <Link className="btn btn-primary" to="/appointments?new=1">Book appointment</Link>
      </PageHeader>
      <div className="stats stats-3">
        <Stat label="Upcoming appointments" value={d.upcoming.length} />
        <Stat label="Medical records" value={d.records} />
        <Stat label="Amount due" value={inr(d.unpaidAmount)} note={`${d.unpaidCount} unpaid bill${d.unpaidCount === 1 ? '' : 's'}`} tone={d.unpaidCount ? 'amber' : 'green'} />
      </div>
      <section className="card">
        <div className="card-head"><h2>Upcoming appointments</h2><Link to="/appointments">All appointments</Link></div>
        {d.upcoming.length === 0 ? <Empty>No upcoming appointments. <Link to="/appointments?new=1">Book one</Link></Empty> : (
          <div className="appt-cards">
            {d.upcoming.map((a) => (
              <div className="appt-card" key={a._id}>
                <div className="appt-date">
                  <span>{new Date(`${a.date}T00:00:00`).toLocaleDateString('en-IN', { month: 'short' })}</span>
                  <strong>{a.date.slice(8)}</strong>
                </div>
                <div>
                  <div className="strong">{a.doctor?.name}</div>
                  <div className="sub">{a.doctor?.specialization} · {fmtTime(a.time)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default function Dashboard() {
  const { user, doctor } = useAuth();
  const { data, loading, error } = useFetch('/dashboard');
  if (loading && !data) return <Loading />;
  if (error) return <div className="alert">{error}</div>;
  if (data.role === 'doctor') return <DoctorDashboard d={data} doctor={doctor} />;
  if (data.role === 'patient') return <PatientDashboard d={data} user={user} />;
  return <StaffDashboard d={data} user={user} />;
}
