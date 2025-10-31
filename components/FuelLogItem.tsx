
import React from 'react';
import { FuelLog, User, LogStatus } from '../types';
import { useAuth } from '../hooks/useAuth';

interface FuelLogItemProps {
  log: FuelLog;
  driver?: User;
  distance?: number;
  onApprove?: () => void;
  onReject?: () => void;
  onCorrect?: () => void;
}

const statusStyles: Record<LogStatus, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente' },
    approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approuvée' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejetée' },
};

const FuelLogItem: React.FC<FuelLogItemProps> = ({ log, driver, distance, onApprove, onReject, onCorrect }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const formattedDate = new Date(log.date).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  
  const statusStyle = statusStyles[log.status];

  return (
    <li className="overflow-hidden bg-white rounded-lg shadow">
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-blue-600 truncate">
                    {driver ? `${driver.driverName} (${log.plateNumber})` : log.plateNumber}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                    {formattedDate}
                </p>
            </div>
            <div className="flex-shrink-0 ml-2">
                <p className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                    {statusStyle.label}
                </p>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4">
            <div className="p-2 bg-gray-50 rounded-md">
                <dt className="text-sm font-medium text-gray-500">Coût Total</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{log.totalCost.toFixed(2)} MAD</dd>
            </div>
            <div className="p-2 bg-gray-50 rounded-md">
                <dt className="text-sm font-medium text-gray-500">Odomètre</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{log.odometer.toLocaleString('fr-FR')} km</dd>
            </div>
            <div className="p-2 bg-gray-50 rounded-md">
                <dt className="text-sm font-medium text-gray-500">Litres</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{log.liters.toFixed(2)} L</dd>
            </div>
            <div className="p-2 bg-gray-50 rounded-md">
                <dt className="text-sm font-medium text-gray-500">Distance</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{distance ? `${distance.toLocaleString('fr-FR')} km` : '-'}</dd>
            </div>
        </div>
      </div>
      {(log.remarks || (log.receiptPhotos && log.receiptPhotos.length > 0)) && (
          <div className="px-4 py-4 border-t border-gray-200 sm:px-6">
              {log.remarks && <p className="text-sm text-gray-600"><span className="font-medium">Remarques:</span> {log.remarks}</p>}
              {log.receiptPhotos && log.receiptPhotos.length > 0 && (
                 <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Justificatifs:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {log.receiptPhotos.map((photo, index) => (
                           <a href={photo} target="_blank" rel="noopener noreferrer" key={index}>
                             <img  src={photo} alt={`Justificatif ${index + 1}`} className="object-cover rounded-lg cursor-pointer max-h-56 hover:opacity-80"/>
                           </a>
                        ))}
                    </div>
                </div>
              )}
          </div>
      )}

      {log.status === 'rejected' && log.rejectionReason && (
          <div className="px-4 py-3 bg-red-50 sm:px-6">
              <p className="text-sm font-bold text-red-800">Raison du rejet: <span className="font-normal">{log.rejectionReason}</span></p>
          </div>
      )}

      <div className="px-4 py-3 bg-gray-50 sm:px-6">
        {isAdmin && log.status === 'pending' && onApprove && onReject && (
            <div className="flex justify-end space-x-2">
                <button onClick={onReject} className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700">Rejeter</button>
                <button onClick={onApprove} className="px-3 py-1 text-sm text-white bg-green-600 rounded-md hover:bg-green-700">Approuver</button>
            </div>
        )}
        {!isAdmin && log.status === 'rejected' && onCorrect && (
            <div className="flex justify-end">
                <button onClick={onCorrect} className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">Corriger</button>
            </div>
        )}
      </div>
    </li>
  );
};

export default FuelLogItem;