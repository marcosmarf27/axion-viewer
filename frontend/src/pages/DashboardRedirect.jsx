import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from './admin/AdminDashboard';
import ClientDashboard from './client/ClientDashboard';

export default function DashboardRedirect() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <ClientDashboard />;
}
