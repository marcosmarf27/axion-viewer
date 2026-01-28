import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from './admin/AdminDashboard';

export default function DashboardRedirect() {
  const { isAdmin, profile } = useAuth();

  // Aguarda o profile carregar antes de decidir a rota
  if (!profile) return null;

  if (!isAdmin) return <Navigate to="/portal" replace />;
  return <AdminDashboard />;
}
