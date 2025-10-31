import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCity } from '../App';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { city, setCity } = useCity();

  const handleLogout = () => {
    logout();
    setCity(null);
  }

  return (
    <header className="bg-white shadow-md">
      <div className="container flex items-center justify-between px-4 py-4 mx-auto">
        <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V5m0 14v-1M9 12l-2 2 2 2m6-4l2 2-2 2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-800">Fuel Log Pro</h1>
            {user?.role === 'admin' && city && (
                <span className="px-3 py-1 text-sm font-semibold text-white bg-gray-700 rounded-full">{city}</span>
            )}
        </div>
        {user && (
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Bonjour, <span className="font-medium">{user.driverName}</span>!</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
