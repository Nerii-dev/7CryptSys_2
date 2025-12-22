import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/User';
import { 
  Users,
  LayoutDashboard, 
  ShoppingCart, 
  Truck, 
  CheckSquare, 
  BarChart2, 
  Settings, 
  LogOut,
  ClipboardList, // Novo ícone para Contagem
  AlertTriangle // Novo ícone para Sinistros
} from 'lucide-react';

type NavLinkItem = { name: string; path: string; icon: JSX.Element };

const commonLinks: NavLinkItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
  { name: 'Contagem Diária', path: '/counting', icon: <ClipboardList className="w-5 h-5 mr-3" /> },
  { name: 'Vendas', path: '/sales', icon: <ShoppingCart className="w-5 h-5 mr-3" /> },
  { name: 'Expedição', path: '/shipping', icon: <Truck className="w-5 h-5 mr-3" /> },
  { name: 'Tarefas', path: '/tasks', icon: <CheckSquare className="w-5 h-5 mr-3" /> },
  { name: 'Relatórios', path: '/reports', icon: <BarChart2 className="w-5 h-5 mr-3" /> },
  { name: 'Sinistros', path: '/claims', icon: <AlertTriangle className="w-5 h-5 mr-3" /> },
];

// ATUALIZE A PARTE DO ADMIN DENTRO DE navConfig:
const navConfig: Record<UserRole, { title: string; links: NavLinkItem[] }> = {
  admin: {
    title: 'Admin',
    links: [
      ...commonLinks,
      { name: 'Gestão de Usuários', path: '/users', icon: <Users className="w-5 h-5 mr-3" /> },
      { name: 'Configurações', path: '/settings', icon: <Settings className="w-5 h-5 mr-3" /> },
    ],
  },
  sales: {
    title: 'Vendas',
    links: [
      { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
      { name: 'Vendas', path: '/sales', icon: <ShoppingCart className="w-5 h-5 mr-3" /> },
      { name: 'Relatórios', path: '/reports', icon: <BarChart2 className="w-5 h-5 mr-3" /> },
    ],
  },
  shipping: {
    title: 'Expedição',
    links: [
      { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
      { name: 'Expedição', path: '/shipping', icon: <Truck className="w-5 h-5 mr-3" /> },
      { name: 'Tarefas', path: '/tasks', icon: <CheckSquare className="w-5 h-5 mr-3" /> },
    ],
  },
  metrics: {
    title: 'Métricas',
    links: [
      { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
      { name: 'Métricas', path: '/metrics', icon: <BarChart2 className="w-5 h-5 mr-3" /> },
      { name: 'Relatórios', path: '/reports', icon: <BarChart2 className="w-5 h-5 mr-3" /> },
    ],
  },
};

export const Sidebar = () => {
  const { logout, userProfile } = useAuth();
  const role: UserRole = userProfile?.role ?? 'admin';
  const menu = navConfig[role] ?? { title: '', links: commonLinks };

  return (
    // CORREÇÃO AQUI: Removido 'fixed', 'left-0', 'top-0', 'z-10', 'min-h-screen'
    // Adicionado: 'flex-shrink-0' para garantir que ela não encolha
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0 transition-all duration-300">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">7CryptSys</h1>
        <p className="text-xs text-gray-500 mt-1">Gestão Integrada</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menu.links.map(link => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => `flex items-center p-3 rounded-lg transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            {link.icon}
            <span className="font-medium">{link.name}</span>
          </NavLink>
        ))}

        <div className="pt-4 mt-4 border-t border-gray-200">
          {/* Em alguns perfis 'Configurações' já está no menu; manter redundância aqui é aceitável */}
          <NavLink to="/settings" className={({ isActive }) => `flex items-center p-3 rounded-lg transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <Settings className="w-5 h-5 mr-3" />
            <span className="font-medium">Configurações</span>
          </NavLink>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={logout}
          className="flex items-center w-full p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
};