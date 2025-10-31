
import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFuelData } from '../hooks/useFuelData';
import FuelLogForm from './FuelLogForm';
import FuelLogItem from './FuelLogItem';
import { FuelLog, User } from '../types';

const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const { getLogsByPlate } = useFuelData();
  const [editingLog, setEditingLog] = useState<FuelLog | null>(null);
  const [showForm, setShowForm] = useState(false);

  if (!user || !user.city || !user.username) {
    return <div className="text-center text-red-500">Erreur: Données utilisateur invalides.</div>;
  }

  const driverLogs = useMemo(() => {
    return getLogsByPlate(user.username!, user.city!).map((log, index, arr) => {
        const prevLog = arr[index + 1];
        const distance = prevLog ? log.odometer - prevLog.odometer : 0;
        return { ...log, distance };
    });
  }, [getLogsByPlate, user.username, user.city]);

  const handleEdit = (log: FuelLog) => {
    setEditingLog(log);
    setShowForm(true);
  };
  
  const handleFormClose = () => {
      setEditingLog(null);
      setShowForm(false);
  }

  const handleAddNew = () => {
      setEditingLog(null);
      setShowForm(true);
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Mon Tableau de bord</h1>
        {!showForm && (
            <button onClick={handleAddNew} className="px-4 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                + Ajouter une consommation
            </button>
        )}
      </div>

      {showForm ? (
        <FuelLogForm existingLog={editingLog} onFormClose={handleFormClose} />
      ) : (
        <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-700">Historique de mes déclarations</h2>
            {driverLogs.length > 0 ? (
                <ul className="space-y-4">
                    {driverLogs.map(log => (
                        <FuelLogItem 
                            key={log.id} 
                            log={log} 
                            driver={user as User} 
                            distance={log.distance > 0 ? log.distance : undefined}
                            onCorrect={() => handleEdit(log)} 
                        />
                    ))}
                </ul>
            ) : (
                <div className="p-8 text-center bg-white rounded-lg shadow-md">
                    <p className="text-gray-500">Vous n'avez pas encore d'entrée de carburant.</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;