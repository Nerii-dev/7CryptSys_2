import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar = () => {
  const { userProfile, logout } = useAuth();
  return (
    <header className="bg-white shadow-md p-4 flex justify-center items-center relative z-10">
      <Link to="/dashboard">
        <span className="text-2xl font-bold text-blue-600">7CryptSys</span>
      </Link>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm text-gray-500">Logado como:</p>
          <p className="font-mono text-gray-800 break-words max-w-xs">
            {userProfile?.email || 'Carregando...'}
          </p>
        </div>
        <button
          onClick={logout}
          className="bg-red-500 text-white py-2 px-4 rounded-lg shadow hover:bg-red-600 transition-colors"
        >
          Sair
        </button>
      </div>
    </header>
  );
};