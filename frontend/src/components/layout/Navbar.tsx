import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Truck, 
  CheckSquare, 
  BarChart2, 
  Settings, 
  LogOut,
  ClipboardList, // Novo ícone para Contagem
  AlertTriangle // Novo ícone para Sinistros
} from "lucide-react";

export const Sidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path 
    ? "bg-blue-50 text-blue-600" 
    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900";

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col fixed left-0 top-0 h-full z-10">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">7CryptSys</h1>
        <p className="text-xs text-gray-500 mt-1">Gestão Integrada</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <Link to="/dashboard" className={`flex items-center p-3 rounded-lg transition-colors ${isActive('/dashboard')}`}>
          <LayoutDashboard className="w-5 h-5 mr-3" />
          <span className="font-medium">Dashboard</span>
        </Link>

        {/* Novas Páginas de Operação */}
        <Link to="/counting" className={`flex items-center p-3 rounded-lg transition-colors ${isActive('/counting')}`}>
          <ClipboardList className="w-5 h-5 mr-3" />
          <span className="font-medium">Contagem Diária</span>
        </Link>
        
        <Link to="/sales" className={`flex items-center p-3 rounded-lg transition-colors ${isActive('/sales')}`}>
          <ShoppingCart className="w-5 h-5 mr-3" />
          <span className="font-medium">Vendas</span>
        </Link>

        <Link to="/shipping" className={`flex items-center p-3 rounded-lg transition-colors ${isActive('/shipping')}`}>
          <Truck className="w-5 h-5 mr-3" />
          <span className="font-medium">Expedição</span>
        </Link>

        <Link to="/tasks" className={`flex items-center p-3 rounded-lg transition-colors ${isActive('/tasks')}`}>
          <CheckSquare className="w-5 h-5 mr-3" />
          <span className="font-medium">Tarefas</span>
        </Link>

        <Link to="/reports" className={`flex items-center p-3 rounded-lg transition-colors ${isActive('/reports')}`}>
          <BarChart2 className="w-5 h-5 mr-3" />
          <span className="font-medium">Relatórios</span>
        </Link>

        <Link to="/claims" className={`flex items-center p-3 rounded-lg transition-colors ${isActive('/claims')}`}>
          <AlertTriangle className="w-5 h-5 mr-3" />
          <span className="font-medium">Sinistros</span>
        </Link>

        <div className="pt-4 mt-4 border-t border-gray-200">
            <Link to="/settings" className={`flex items-center p-3 rounded-lg transition-colors ${isActive('/settings')}`}>
            <Settings className="w-5 h-5 mr-3" />
            <span className="font-medium">Configurações</span>
            </Link>
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