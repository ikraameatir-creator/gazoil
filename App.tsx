import React, { useState, createContext, useContext, ReactNode } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import DriverDashboard from './components/DriverDashboard';
import Header from './components/Header';
import { FuelDataProvider } from './hooks/useFuelData';
import { City } from './types';

// 1. Create City Context
interface CityContextType {
    city: City | null;
    setCity: (city: City | null) => void;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export const useCity = () => {
    const context = useContext(CityContext);
    if (!context) throw new Error("useCity must be used within a CityProvider");
    return context;
};

// 2. City Selection Component
const CitySelection: React.FC<{ onSelect: (city: City) => void }> = ({ onSelect }) => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-8 text-center bg-white rounded-2xl shadow-lg">
                <h2 className="text-3xl font-extrabold text-gray-900">Sélectionner une ville</h2>
                <p className="text-gray-600">Veuillez choisir le site que vous souhaitez gérer.</p>
                <div className="flex justify-center space-x-4">
                    <button onClick={() => onSelect('Salé')} className="px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                        Salé
                    </button>
                    <button onClick={() => onSelect('Zemamra')} className="px-8 py-4 text-lg font-bold text-white bg-green-600 rounded-lg hover:bg-green-700">
                        Zemamra
                    </button>
                </div>
            </div>
        </div>
    );
};


const AppContent: React.FC = () => {
    const { user } = useAuth();
    const { city, setCity } = useCity();

    if (!user) {
        return <Login />;
    }
    
    if (user.role === 'admin' && !city) {
        return <CitySelection onSelect={setCity} />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main>
                {user.role === 'admin' && city && <AdminDashboard />}
                {user.role === 'driver' && <DriverDashboard />}
            </main>
        </div>
    );
};

const App: React.FC = () => {
    const [city, setCity] = useState<City | null>(null);

    return (
        <AuthProvider>
            <FuelDataProvider>
                 <CityContext.Provider value={{ city, setCity }}>
                    <AppContent />
                 </CityContext.Provider>
            </FuelDataProvider>
        </AuthProvider>
    );
};

export default App;
