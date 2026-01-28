import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from './admin/AdminDashboard';

export default function DashboardRedirect() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/portal" replace />;
  return <AdminDashboard />;
}
