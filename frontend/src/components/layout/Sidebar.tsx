import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/User';
import { 
  Users, // Importante: O ícone deve estar importado aqui
  LayoutDashboard, 
  ShoppingCart, 
  Truck, 
  CheckSquare, 
  BarChart2, 
  Settings,
  LogOut,
  ClipboardList,
  AlertTriangle
} from 'lucide-react';

interface NavLinkItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const navConfig: Record<UserRole, { title: string; links: NavLinkItem[] }> = {
  admin: {
    title: 'Admin',
    links: [
      { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      { name: 'Vendas', path: '/sales', icon: <ShoppingCart className="w-5 h-5" /> },
      { name: 'Expedição', path: '/shipping', icon: <Truck className="w-5 h-5" /> },
      { name: 'Tarefas', path: '/tasks', icon: <CheckSquare className="w-5 h-5" /> },
      { name: 'Métricas', path: '/metrics', icon: <BarChart2 className="w-5 h-5" /> },
      { name: 'Contagem', path: '/counting', icon: <ClipboardList className="w-5 h-5" /> },
      { name: 'Sinistros', path: '/claims', icon: <AlertTriangle className="w-5 h-5" /> },
      // Link de Gestão de Usuários
      { name: 'Gestão de Usuários', path: '/users', icon: <Users className="w-5 h-5" /> },
      { name: 'Configurações', path: '/settings', icon: <Settings className="w-5 h-5" /> },
    ],
  },
  sales: {
    title: 'Vendas',
    links: [
      { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      { name: 'Vendas', path: '/sales', icon: <ShoppingCart className="w-5 h-5" /> },
      { name: 'Tarefas', path: '/tasks', icon: <CheckSquare className="w-5 h-5" /> },
      { name: 'Sinistros', path: '/claims', icon: <AlertTriangle className="w-5 h-5" /> },
    ],
  },
  shipping: {
    title: 'Expedição',
    links: [
      { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      { name: 'Expedição', path: '/shipping', icon: <Truck className="w-5 h-5" /> },
      { name: 'Tarefas', path: '/tasks', icon: <CheckSquare className="w-5 h-5" /> },
      { name: 'Contagem', path: '/counting', icon: <ClipboardList className="w-5 h-5" /> },
      { name: 'Sinistros', path: '/claims', icon: <AlertTriangle className="w-5 h-5" /> },
    ],
  },
  metrics: {
    title: 'Métricas',
    links: [
      { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      { name: 'Métricas', path: '/metrics', icon: <BarChart2 className="w-5 h-5" /> },
    ],
  },
};

export const Sidebar = () => {
  const { userProfile, logout } = useAuth(); // Adicionei o logout aqui
  const role = userProfile?.role;

  // Debug: Veja no console do navegador se o perfil está carregando corretamente
  console.log("Sidebar Perfil:", userProfile);

  if (!role) {
    return <div className="w-64 bg-white shadow-lg p-4">Carregando menu...</div>;
  }

  // Fallback seguro: se a role não existir no config, usa 'metrics' ou 'sales' para não quebrar
  const { title, links } = navConfig[role] || navConfig.sales;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0 transition-all duration-300">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">7CryptSys</h1>
        <p className="text-xs text-gray-500 mt-1">Gestão Integrada</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            end={link.path === '/dashboard'} // 'end' apenas no dashboard evita problemas de rota ativa
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {link.icon}
            <span className="font-medium">{link.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="mb-4 px-2">
            <p className="text-sm font-semibold text-gray-800 capitalize">{userProfile.name}</p>
            <p className="text-xs text-gray-500 capitalize">{title}</p>
        </div>
        <button 
          onClick={() => logout()}
          className="flex items-center w-full p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
};