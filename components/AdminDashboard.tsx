
import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFuelData } from '../hooks/useFuelData';
import { useCity } from '../App';
import FuelLogItem from './FuelLogItem';
import Reports from './Reports';
import DashboardSummary from './DashboardSummary';
import { User } from '../types';

// Sub-component for Vehicle Management
const VehicleManagement: React.FC = () => {
    const { city } = useCity();
    const { getUsersByCity, addUser, updateUser, deleteUser, findUserByPlate } = useAuth();
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [error, setError] = useState('');

    if (!city) return null;
    const users = getUsersByCity(city);

    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        if (!editingUser || !city) return;

        const formData = new FormData(e.currentTarget);
        const username = formData.get('username') as string;
        
        // Prevent duplicate plate numbers (usernames)
        if (editingUser.id === 0 && findUserByPlate(username, city)) {
            setError(`La plaque d'immatriculation '${username}' existe déjà.`);
            return;
        }

        const updatedDetails: Partial<User> = {
            driverName: formData.get('driverName') as string,
            password: formData.get('password') as string || editingUser.password,
            phone: formData.get('phone') as string,
        };

        if (editingUser.id === 0) { // New user
            addUser({
                username,
                driverName: updatedDetails.driverName,
                password: updatedDetails.password,
                phone: updatedDetails.phone,
                city: city,
            }, city);
        } else {
            updateUser({ ...editingUser, ...updatedDetails }, city);
        }
        setEditingUser(null);
    };

    const handleAddNew = () => {
        setEditingUser({ id: 0, username: '', role: 'driver', driverName: '', password: '', phone: '', city: city });
    };

    return (
        <div>
            {editingUser ? (
                <div className="p-4 mt-4 bg-gray-50 rounded-lg shadow-inner">
                    <h3 className="text-lg font-medium">{editingUser.id === 0 ? 'Ajouter un Véhicule/Chauffeur' : 'Modifier les informations'}</h3>
                    <form onSubmit={handleSave} className="mt-4 space-y-4">
                        <input type="text" name="driverName" defaultValue={editingUser.driverName} placeholder="Nom du chauffeur" required className="w-full px-2 py-1 border rounded" />
                        <input type="text" name="username" defaultValue={editingUser.username} placeholder="Plaque d'immatriculation (Nom d'utilisateur)" required disabled={editingUser.id !== 0} className="w-full px-2 py-1 border rounded disabled:bg-gray-200" />
                        <input type="text" name="password" placeholder={editingUser.id !== 0 ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'} required={editingUser.id === 0} className="w-full px-2 py-1 border rounded" />
                        <input type="tel" name="phone" defaultValue={editingUser.phone} placeholder="Numéro de téléphone" required className="w-full px-2 py-1 border rounded" />
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <div className="flex justify-end space-x-2">
                            <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-md">Annuler</button>
                            <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md">Enregistrer</button>
                        </div>
                    </form>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Véhicules / Chauffeurs</h3>
                        <button onClick={handleAddNew} className="px-4 py-2 text-sm text-white bg-green-600 rounded-md">+ Ajouter</button>
                    </div>
                    <ul className="space-y-2">
                        {users.map(user => (
                            <li key={user.id} className="flex items-center justify-between p-3 bg-white rounded shadow-sm">
                                <span>{user.driverName} ({user.username})</span>
                                <div>
                                    <button onClick={() => setEditingUser(user)} className="mr-2 text-blue-600">Modifier</button>
                                    <button onClick={() => window.confirm('Êtes-vous sûr ?') && deleteUser(user.id, city)} className="text-red-600">Supprimer</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
};

const AdminAccount: React.FC = () => {
    const { user, updateAdmin } = useAuth();
    const [username, setUsername] = useState(user?.username || '');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        if (password && password !== confirm) {
            setMessage('Les mots de passe ne correspondent pas.');
            return;
        }
        if (!user) return;
        const updatedAdmin = { ...user, username };
        if (password) {
            updatedAdmin.password = password;
        }
        updateAdmin(updatedAdmin);
        setMessage('Informations mises à jour avec succès.');
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Gérer mon compte</h3>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Nom d'utilisateur" required className="w-full px-2 py-1 border rounded" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nouveau mot de passe" className="w-full px-2 py-1 border rounded" />
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirmer le mot de passe" className="w-full px-2 py-1 border rounded" />
                {message && <p className="text-sm text-green-600">{message}</p>}
                <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md">Mettre à jour</button>
            </form>
        </div>
    )
}

// Main Admin Dashboard
const AdminDashboard: React.FC = () => {
  const { city } = useCity();
  const { getFuelLogs, updateLogStatus } = useFuelData();
  const { getUsersByCity } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'vehicles' | 'reports' | 'account'>('dashboard');
  
  if (!city) return null;
  const users = getUsersByCity(city);
  const findDriver = (plate: string) => users.find(u => u.username === plate);

  const fuelLogs = useMemo(() => {
    return getFuelLogs(city).map((log, index, arr) => {
        const sortedArr = [...arr]
            .filter(l => l.plateNumber === log.plateNumber)
            .sort((a,b) => a.odometer - b.odometer);
        const currentLogIndex = sortedArr.findIndex(l => l.id === log.id);
        const prevLog = sortedArr[currentLogIndex - 1];
        const distance = prevLog && log.odometer > prevLog.odometer ? log.odometer - prevLog.odometer : 0;
        return { ...log, distance };
    });
  }, [getFuelLogs, city]);
  

  const handleApprove = (logId: number) => {
    updateLogStatus(logId, 'approved', city);
  };

  const handleReject = (logId: number) => {
    const reason = prompt("Veuillez entrer la raison du rejet :");
    if (reason) {
      updateLogStatus(logId, 'rejected', city, reason);
    }
  };
  
  const renderContent = () => {
      switch(activeTab){
          case 'dashboard':
              return <DashboardSummary logs={fuelLogs} onApprove={handleApprove} onReject={handleReject} findDriver={findDriver} />;
          case 'history':
              return (
                <ul className="space-y-4">
                    {fuelLogs.map(log => (
                    <FuelLogItem 
                        key={log.id} 
                        log={log} 
                        driver={findDriver(log.plateNumber)}
                        distance={log.distance > 0 ? log.distance : undefined}
                        onApprove={() => handleApprove(log.id)}
                        onReject={() => handleReject(log.id)}
                    />
                    ))}
                </ul>
              );
          case 'vehicles':
              return <VehicleManagement />;
          case 'reports':
              return <Reports />;
          case 'account':
              return <AdminAccount />;
      }
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="mb-8 text-3xl font-bold text-gray-800">Tableau de bord Administrateur</h1>
      
      <div className="mb-4 border-b border-gray-200">
        <nav className="flex -mb-px space-x-8" aria-label="Tabs">
            <button onClick={() => setActiveTab('dashboard')} className={`${activeTab === 'dashboard' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Tableau de Bord</button>
            <button onClick={() => setActiveTab('history')} className={`${activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Historique</button>
            <button onClick={() => setActiveTab('vehicles')} className={`${activeTab === 'vehicles' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Gérer les Véhicules</button>
            <button onClick={() => setActiveTab('reports')} className={`${activeTab === 'reports' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Rapports</button>
            <button onClick={() => setActiveTab('account')} className={`${activeTab === 'account' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Mon Compte</button>
        </nav>
      </div>

      <div>
          {renderContent()}
          {activeTab === 'history' && fuelLogs.length === 0 && <p>Aucune consommation enregistrée pour {city}.</p>}
      </div>

    </div>
  );
};

export default AdminDashboard;