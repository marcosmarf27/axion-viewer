import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, FolderOpen, Scale,
  FileText, FileUp, Palette, UserCog, Share2, BookOpen, HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTour } from '@/hooks/useTour';
import { cn } from '@/lib/utils';
import TourOverlay from '@/components/tour/TourOverlay';

const tourTargetMap = {
  '/admin/clientes': 'nav-clientes',
  '/admin/carteiras': 'nav-carteiras',
  '/admin/casos': 'nav-casos',
  '/admin/processos': 'nav-processos',
  '/admin/documentos': 'nav-documentos',
  '/admin/convert': 'nav-converter',
  '/admin/accounts': 'nav-contas',
  '/admin/sharing': 'nav-compartilhamento',
};

const adminNavGroups = [
  {
    label: 'PRINCIPAL',
    items: [{ label: 'Dashboard', path: '/', icon: 'LayoutDashboard' }],
  },
  {
    label: 'CADASTROS',
    items: [
      { label: 'Clientes', path: '/admin/clientes', icon: 'Users' },
      { label: 'Carteiras', path: '/admin/carteiras', icon: 'Briefcase' },
      { label: 'Casos', path: '/admin/casos', icon: 'FolderOpen' },
      { label: 'Processos', path: '/admin/processos', icon: 'Scale' },
      { label: 'Documentos', path: '/admin/documentos', icon: 'FileText' },
    ],
  },
  {
    label: 'FERRAMENTAS',
    items: [
      { label: 'Converter', path: '/admin/convert', icon: 'FileOutput' },
      { label: 'Temas', path: '/admin/themes', icon: 'Palette' },
    ],
  },
  {
    label: 'ADMINISTRACAO',
    items: [
      { label: 'Contas', path: '/admin/accounts', icon: 'UserCog' },
      { label: 'Compartilhamento', path: '/admin/sharing', icon: 'Share2' },
    ],
  },
  {
    label: 'AJUDA',
    items: [{ label: 'Documentacao', path: '/admin/docs', icon: 'BookOpen' }],
  },
];

const clientNavGroups = [
  {
    label: 'PRINCIPAL',
    items: [
      { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
      { label: 'Minhas Carteiras', path: '/carteiras', icon: 'Briefcase' },
    ],
  },
];

const iconMap = {
  LayoutDashboard: <LayoutDashboard className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  Briefcase: <Briefcase className="h-5 w-5" />,
  FolderOpen: <FolderOpen className="h-5 w-5" />,
  Scale: <Scale className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
  FileOutput: <FileUp className="h-5 w-5" />,
  Palette: <Palette className="h-5 w-5" />,
  UserCog: <UserCog className="h-5 w-5" />,
  Share2: <Share2 className="h-5 w-5" />,
  BookOpen: <BookOpen className="h-5 w-5" />,
};

const breadcrumbLabels = {
  admin: 'Admin',
  clientes: 'Clientes',
  carteiras: 'Carteiras',
  casos: 'Casos',
  processos: 'Processos',
  documentos: 'Documentos',
  convert: 'Converter',
  themes: 'Temas',
  accounts: 'Contas',
  sharing: 'Compartilhamento',
  docs: 'Documentacao',
};

function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-slate-500">
      <Link to="/" className="hover:text-slate-700">
        Inicio
      </Link>
      {segments.map((segment, idx) => {
        const path = '/' + segments.slice(0, idx + 1).join('/');
        const label = breadcrumbLabels[segment] || segment;
        const isLast = idx === segments.length - 1;

        return (
          <span key={path} className="flex items-center gap-1">
            <span className="text-slate-300">/</span>
            {isLast ? (
              <span className="font-medium text-slate-900">{label}</span>
            ) : (
              <Link to={path} className="hover:text-slate-700">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

function UserAvatar({ name, email }) {
  const displayName = name || email || '';
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
      {initials || '?'}
    </div>
  );
}

export default function Layout() {
  const { profile, signOut } = useAuth();
  const { startTour, isActive: tourActive, hidden: tourHidden, showTour } = useTour();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showReactivate, setShowReactivate] = useState(false);

  const navGroups = profile?.role === 'admin' ? adminNavGroups : clientNavGroups;

  const isActive = path => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-white transition-transform md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 text-white"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v18" />
              <path d="M5 7l7-4 7 4" />
              <path d="M5 7l-1 5c0 1.5 1 2 2.5 2S9 13.5 9 12L8 7" />
              <path d="M19 7l-1 5c0 1.5 1 2 2.5 2S23 13.5 23 12l-1-5" />
              <path d="M9 21h6" />
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight text-white">Axion Viewer</span>
        </div>

        {/* Navigation groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navGroups.map((group, gi) => (
            <div key={group.label} className={cn(gi > 0 && 'mt-6')}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map(item => {
                  const active = isActive(item.path);
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        data-tour={tourTargetMap[item.path]}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'border-r-2 border-indigo-400 bg-indigo-600/10 text-indigo-400'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        )}
                      >
                        {iconMap[item.icon]}
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-slate-800 px-5 py-3">
          {profile?.role === 'admin' && (
            tourHidden ? (
              <div className="relative mb-2">
                <button
                  onClick={() => setShowReactivate(!showReactivate)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
                  title="Tour guiado desativado"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
                {showReactivate && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 rounded-lg border border-slate-700 bg-slate-800 p-3 shadow-lg">
                    <p className="mb-2 text-xs text-slate-300">Tour guiado esta desativado.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { showTour(); setShowReactivate(false); }}
                        className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700"
                      >
                        Reativar
                      </button>
                      <button
                        onClick={() => setShowReactivate(false)}
                        className="rounded px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  startTour();
                }}
                className="mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
              >
                <HelpCircle className="h-4 w-4" />
                Tour Guiado
              </button>
            )
          )}
          <div className="text-[11px] text-slate-600">Axion Viewer v3.0</div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm md:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              data-tour="mobile-menu"
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
            <Breadcrumb />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 sm:flex">
              <UserAvatar name={profile?.full_name} email={profile?.email} />
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700">
                  {profile?.full_name || profile?.email}
                </p>
                <p className="text-[11px] text-slate-400">
                  {profile?.role === 'admin' ? 'Administrador' : 'Cliente'}
                </p>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
              Sair
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {tourActive && <TourOverlay />}
    </div>
  );
}
