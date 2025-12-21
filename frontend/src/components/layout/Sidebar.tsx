import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/User';

const IconPlaceholder = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2Z"
    />
  </svg>
);

const navConfig: Record<UserRole, { title: string; links: NavLinkItem[] }> = {
  admin: {
    title: 'Admin',
    links: [
      { name: 'Dashboard', path: '/dashboard', icon: <IconPlaceholder /> },
      { name: 'Vendas', path: '/sales', icon: <IconPlaceholder /> },
      { name: 'Expedição', path: '/shipping', icon: <IconPlaceholder /> },
      { name: 'Tarefas', path: '/tasks', icon: <IconPlaceholder /> },
      { name: 'Métricas', path: '/metrics', icon: <IconPlaceholder /> },
      { name: 'Configurações', path: '/settings', icon: <IconPlaceholder /> },
    ],
  },
  sales: {
    title: 'Vendas',
    links: [
      { name: 'Dashboard', path: '/dashboard', icon: <IconPlaceholder /> },
      { name: 'Gestão de Vendas', path: '/sales', icon: <IconPlaceholder /> },
      { name: 'Tarefas', path: '/tasks', icon: <IconPlaceholder /> },
    ],
  },
  shipping: {
    title: 'Expedição',
    links: [
      { name: 'Dashboard', path: '/dashboard', icon: <IconPlaceholder /> },
      { name: 'Scanner', path: '/shipping', icon: <IconPlaceholder /> },
      { name: 'Tarefas', path: '/tasks', icon: <IconPlaceholder /> },
    ],
  },
  metrics: {
    title: 'Métricas',
    links: [
      { name: 'Dashboard', path: '/dashboard', icon: <IconPlaceholder /> },
      { name: 'Relatórios', path: '/metrics', icon: <IconPlaceholder /> },
    ],
  },
};

interface NavLinkItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export const Sidebar = () => {
  const { userProfile } = useAuth();
  const role = userProfile?.role;

  if (!role) {
    return <div className="w-64 bg-white shadow-lg p-4">Carregando...</div>;
  }

  const { title, links } = navConfig[role] || navConfig.metrics;

  return (
    <aside className="w-64 h-full bg-white shadow-lg flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">Setor:</h2>
        <h3 className="text-lg font-semibold text-blue-600">{title}</h3>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            end // Garante que 'Dashboard' só fique ativo na rota exata
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            {link.icon}
            <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t text-xs text-gray-400">
        <p>&copy; 2025 7CryptSys</p>
      </div>
    </aside>
  );
};

