
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFuelData } from '../hooks/useFuelData';
import { FuelLog } from '../types';

interface FuelLogFormProps {
    existingLog?: FuelLog | null;
    onFormClose: () => void;
}

const FuelLogForm: React.FC<FuelLogFormProps> = ({ existingLog, onFormClose }) => {
  const { user } = useAuth();
  const { addFuelLog, updateLog, getLastOdometer, getLogsByPlate } = useFuelData();
  
  const [odometer, setOdometer] = useState('');
  const [liters, setLiters] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [remarks, setRemarks] = useState('');
  const [receiptPhotos, setReceiptPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const lastOdometer = user && user.city ? getLastOdometer(user.username!, user.city) : 0;

  useEffect(() => {
    if (existingLog) {
      setOdometer(String(existingLog.odometer));
      setLiters(String(existingLog.liters));
      setTotalCost(String(existingLog.totalCost));
      setRemarks(existingLog.remarks || '');
      setReceiptPhotos(existingLog.receiptPhotos || []);
    }
  }, [existingLog]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const filePromises = Array.from(files).map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(filePromises).then(base64Photos => {
        setReceiptPhotos(prev => [...prev, ...base64Photos]);
      }).catch(err => {
        console.error("Error reading files", err);
        setError("Erreur lors de la lecture des images.");
      });
    }
  };

  const removePhoto = (index: number) => {
    setReceiptPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user || !user.city || !user.username || !user.driverName) {
        setError("Erreur de données utilisateur. Impossible de continuer.");
        return;
    }

    if (receiptPhotos.length === 0) {
        setError("Veuillez ajouter au moins une photo du justificatif.");
        return;
    }

    const odometerNum = parseInt(odometer, 10);
    
    const minOdometer = existingLog 
      ? (getLogsByPlate(user.username, user.city)
          .filter(l => l.id !== existingLog.id && l.status === 'approved') // Compare against other *approved* logs
          .sort((a, b) => b.odometer - a.odometer)[0]?.odometer || 0) 
      : lastOdometer;
    
    if (odometerNum <= minOdometer) {
        setError(`Le kilométrage doit être supérieur à ${minOdometer} km.`);
        return;
    }

    const logData = {
      plateNumber: user.username,
      driverName: user.driverName,
      city: user.city,
      date: new Date().toISOString(),
      odometer: odometerNum,
      liters: parseFloat(liters),
      totalCost: parseFloat(totalCost),
      remarks,
      receiptPhotos,
    };

    try {
        if (existingLog) {
            updateLog({ ...logData, id: existingLog.id, status: 'pending', rejectionReason: '' }, user.city);
        } else {
            await addFuelLog(logData, user.city);
        }
        setSuccess('Entrée enregistrée avec succès !');
        setTimeout(() => onFormClose(), 1500);
    } catch (err: any) {
        setError(err.message);
    }
  };
  
  return (
    <div className="p-8 bg-white rounded-lg shadow-md">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">{existingLog ? 'Corriger une consommation' : 'Ajouter une consommation'}</h2>
      <p className="mb-4 text-sm text-gray-600">Dernier kilométrage approuvé : {lastOdometer} km</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
                <label htmlFor="odometer" className="block text-sm font-medium text-gray-700">Odomètre (km)</label>
                <input type="number" name="odometer" id="odometer" value={odometer} onChange={e => setOdometer(e.target.value)} required className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="liters" className="block text-sm font-medium text-gray-700">Litres</label>
                <input type="number" step="0.01" name="liters" id="liters" value={liters} onChange={e => setLiters(e.target.value)} required className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="totalCost" className="block text-sm font-medium text-gray-700">Coût (MAD)</label>
                <input type="number" step="0.01" name="totalCost" id="totalCost" value={totalCost} onChange={e => setTotalCost(e.target.value)} required className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
        </div>
        <div>
            <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">Remarques (optionnel)</label>
            <textarea name="remarks" id="remarks" value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"></textarea>
        </div>
        <div>
            <label htmlFor="receipt" className="block text-sm font-medium text-gray-700">Justificatifs (photos)</label>
            <input type="file" name="receipt" id="receipt" accept="image/*" multiple onChange={handlePhotoChange} className="block w-full mt-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            {receiptPhotos.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-4">
                    {receiptPhotos.map((photo, index) => (
                        <div key={index} className="relative">
                            <img src={photo} alt={`Aperçu ${index + 1}`} className="object-cover rounded-lg h-28 w-28" />
                            <button type="button" onClick={() => removePhoto(index)} className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 p-1 text-white bg-red-600 rounded-full -mt-2 -mr-2 leading-none">
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <div className="flex justify-end space-x-4">
            <button type="button" onClick={onFormClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                Annuler
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
                Enregistrer
            </button>
        </div>
      </form>
    </div>
  );
};

export default FuelLogForm;
