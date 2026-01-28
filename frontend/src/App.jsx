import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import ClientLayout from '@/components/ClientLayout';
import LoginPage from '@/pages/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';
import DashboardRedirect from '@/pages/DashboardRedirect';

// Admin pages
import ClientesPage from '@/pages/admin/ClientesPage';
import CarteirasPage from '@/pages/admin/CarteirasPage';
import CasosPage from '@/pages/admin/CasosPage';
import ProcessosPage from '@/pages/admin/ProcessosPage';
import ProcessoDetail from '@/pages/admin/ProcessoDetail';
import DocumentosPage from '@/pages/admin/DocumentosPage';
import ConvertPage from '@/pages/admin/ConvertPage';
import ThemesPage from '@/pages/admin/ThemesPage';
import AccountsPage from '@/pages/admin/AccountsPage';
import SharingPage from '@/pages/admin/SharingPage';
import DocsPage from '@/pages/admin/DocsPage';

// Client pages
import ClientPanel from '@/pages/client/ClientPanel';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected (authenticated) */}
      <Route element={<ProtectedRoute />}>
        {/* Admin routes (Layout dark sidebar) */}
        <Route element={<Layout />}>
          <Route index element={<DashboardRedirect />} />

          <Route element={<AdminRoute />}>
            <Route path="admin/clientes" element={<ClientesPage />} />
            <Route path="admin/carteiras" element={<CarteirasPage />} />
            <Route path="admin/carteiras/:id/casos" element={<CasosPage />} />
            <Route path="admin/casos" element={<CasosPage />} />
            <Route path="admin/casos/:id/processos" element={<ProcessosPage />} />
            <Route path="admin/processos" element={<ProcessosPage />} />
            <Route path="admin/processos/:id" element={<ProcessoDetail />} />
            <Route path="admin/documentos" element={<DocumentosPage />} />
            <Route path="admin/convert" element={<ConvertPage />} />
            <Route path="admin/themes" element={<ThemesPage />} />
            <Route path="admin/accounts" element={<AccountsPage />} />
            <Route path="admin/sharing" element={<SharingPage />} />
            <Route path="admin/docs" element={<DocsPage />} />
          </Route>
        </Route>

        {/* Client routes (ClientLayout light sidebar) */}
        <Route path="portal" element={<ClientLayout />}>
          <Route index element={<ClientPanel />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
