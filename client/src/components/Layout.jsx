import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import Icon from './Icon';
import { Avatar } from './ui';

const NAV = {
  admin: [
    ['/', 'Dashboard', 'dashboard'], ['/patients', 'Patients', 'patients'], ['/doctors', 'Doctors', 'doctor'],
    ['/appointments', 'Appointments', 'calendar'], ['/records', 'Medical Records', 'records'], ['/billing', 'Billing', 'billing'],
    ['/pharmacy', 'Pharmacy', 'pharmacy'], ['/staff', 'Staff', 'staff'], ['/users', 'User Accounts', 'users'],
  ],
  receptionist: [
    ['/', 'Dashboard', 'dashboard'], ['/patients', 'Patients', 'patients'], ['/doctors', 'Doctors', 'doctor'],
    ['/appointments', 'Appointments', 'calendar'], ['/billing', 'Billing', 'billing'], ['/pharmacy', 'Pharmacy', 'pharmacy'],
  ],
  doctor: [
    ['/', 'Dashboard', 'dashboard'], ['/appointments', 'My Appointments', 'calendar'], ['/records', 'Medical Records', 'records'],
    ['/patients', 'Patients', 'patients'], ['/profile', 'My Schedule', 'profile'],
  ],
  patient: [
    ['/', 'Home', 'dashboard'], ['/appointments', 'My Appointments', 'calendar'], ['/records', 'My Records', 'records'],
    ['/billing', 'My Bills', 'billing'], ['/profile', 'My Profile', 'profile'],
  ],
};

const ROLE_LABEL = { admin: 'Administrator', receptionist: 'Front Desk', doctor: 'Doctor', patient: 'Patient' };

export default function Layout() {
  const { user, doctor, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">
            <svg viewBox="0 0 32 32" width="30" height="30"><rect width="32" height="32" rx="7" fill="currentColor" /><path d="M13 7h6v6h6v6h-6v6h-6v-6H7v-6h6z" fill="#fff" /></svg>
          </span>
          <div>
            <div className="brand-name">CarePoint</div>
            <div className="brand-sub">Hospital Management</div>
          </div>
        </div>
        <nav onClick={() => setOpen(false)}>
          {NAV[user.role].map(([to, label, icon]) => (
            <NavLink key={to} to={to} end={to === '/'} className="nav-link">
              <Icon name={icon} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="me">
            <Avatar name={user.name} size={34} />
            <div className="me-text">
              <div className="me-name">{user.name}</div>
              <div className="me-role">{doctor ? doctor.specialization : ROLE_LABEL[user.role]}</div>
            </div>
          </div>
          <button className="nav-link logout" onClick={signOut}>
            <Icon name="logout" /> Sign out
          </button>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
          <div className="topbar-date">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <span className="role-chip">{ROLE_LABEL[user.role]}</span>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
