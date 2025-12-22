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
  ClipboardList, 
  AlertTriangle,
  FileText
} from 'lucide-react';

interface NavLinkItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

// Configuração dos menus para cada nível de acesso
const navConfig: Record<UserRole, { title: string; links: NavLinkItem[] }> = {
  admin: {
    title: 'Admin',
    links: [
      { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      { name: 'Vendas', path: '/sales', icon: <ShoppingCart className="w-5 h-5" /> },
      { name: 'Expedição', path: '/shipping', icon: <Truck className="w-5 h-5" /> },
      { name: 'Tarefas', path: '/tasks', icon: <CheckSquare className="w-5 h-5" /> },
      { name: 'Métricas', path: '/metrics', icon: <BarChart2 className="w-5 h-5" /> },
      { name: 'Relatórios', path: '/reports', icon: <FileText className="w-5 h-5" /> }, // Nova Página
      { name: 'Contagem', path: '/counting', icon: <ClipboardList className="w-5 h-5" /> },
      { name: 'Sinistros', path: '/claims', icon: <AlertTriangle className="w-5 h-5" /> },
      { name: 'Gestão de Usuários', path: '/users', icon: <Users className="w-5 h-5" /> }, // Apenas Admin
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
      { name: 'Relatórios', path: '/reports', icon: <FileText className="w-5 h-5" /> },
      { name: 'Métricas', path: '/metrics', icon: <BarChart2 className="w-5 h-5" /> },
    ],
  },
};

export const Sidebar = () => {
  const { userProfile, logout } = useAuth();
  const role = userProfile?.role;

  // Renderização de carregamento ou fallback se não houver role definida
  if (!userProfile || !role) {
    return (
      <aside className="w-64 bg-white border-r border-gray-200 h-full p-4 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Carregando menu...</p>
      </aside>
    );
  }

  // Seleciona a configuração baseada na role (ou usa sales como padrão de segurança)
  const { title, links } = navConfig[role] || navConfig.sales;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0 transition-all duration-300">
      {/* Cabeçalho do Menu */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">7CryptSys</h1>
        <p className="text-xs text-gray-500 mt-1 font-medium">Gestão Integrada 2.0</p>
      </div>

      {/* Lista de Links de Navegação */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === '/dashboard'} // 'end' garante que dashboard não fique ativo em sub-rotas
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {/* Clona o ícone para garantir consistência de tamanho/classe se necessário */}
            {React.cloneElement(link.icon as React.ReactElement, { className: 'w-5 h-5' })}
            <span className="font-medium">{link.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Rodapé com Perfil e Logout */}
      <div className="p-4 border-t border-gray-200 bg-gray-50/50">
        <div className="mb-4 px-2">
            <p className="text-sm font-bold text-gray-800 truncate capitalize">
              {userProfile.name || 'Usuário'}
            </p>
            <div className="flex items-center mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide 
                ${role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                  role === 'shipping' ? 'bg-orange-100 text-orange-700' : 
                  'bg-blue-100 text-blue-700'}`}>
                {title}
              </span>
            </div>
        </div>
        
        <button 
          onClick={() => logout()}
          className="flex items-center justify-center w-full p-2.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border border-transparent hover:border-red-100 group"
        >
          <LogOut className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
};