import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import Layout from './components/Layout';
import { Loading } from './components/ui';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Records from './pages/Records';
import RecordView from './pages/RecordView';
import Billing from './pages/Billing';
import Invoice from './pages/Invoice';
import Pharmacy from './pages/Pharmacy';
import Staff from './pages/Staff';
import Users from './pages/Users';
import Profile from './pages/Profile';

function Guard({ roles, children }) {
  const { user } = useAuth();
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/bills/:id/print" element={<Invoice />} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="patients" element={<Guard roles={['admin', 'receptionist', 'doctor']}><Patients /></Guard>} />
        <Route path="patients/:id" element={<Guard roles={['admin', 'receptionist', 'doctor']}><PatientDetail /></Guard>} />
        <Route path="doctors" element={<Guard roles={['admin', 'receptionist']}><Doctors /></Guard>} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="records" element={<Guard roles={['admin', 'doctor', 'patient']}><Records /></Guard>} />
        <Route path="records/:id" element={<RecordView />} />
        <Route path="billing" element={<Guard roles={['admin', 'receptionist', 'patient']}><Billing /></Guard>} />
        <Route path="pharmacy" element={<Guard roles={['admin', 'receptionist']}><Pharmacy /></Guard>} />
        <Route path="staff" element={<Guard roles={['admin']}><Staff /></Guard>} />
        <Route path="users" element={<Guard roles={['admin']}><Users /></Guard>} />
        <Route path="profile" element={<Guard roles={['doctor', 'patient']}><Profile /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
