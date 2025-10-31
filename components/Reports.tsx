
import React, { useState, useMemo } from 'react';
import { useFuelData } from '../hooks/useFuelData';
import { useAuth } from '../hooks/useAuth';
import { useCity } from '../App';
import { FuelLog, User } from '../types';

// This is to make TypeScript happy with the CDN-loaded library
declare const jspdf: any;

const Reports: React.FC = () => {
    const { city } = useCity();
    const { getFuelLogs } = useFuelData();
    const { getUsersByCity } = useAuth();
    
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(thirtyDaysAgo);
    const [endDate, setEndDate] = useState(today);
    const [selectedVehicle, setSelectedVehicle] = useState('all');

    if (!city) return null;

    const users = getUsersByCity(city);
    const allLogs = getFuelLogs(city);

    const filteredLogs = useMemo(() => {
        return allLogs
            .filter(log => {
                const logDate = new Date(log.date);
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // Include the whole end day
                return logDate >= start && logDate <= end;
            })
            .filter(log => selectedVehicle === 'all' || log.plateNumber === selectedVehicle)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allLogs, startDate, endDate, selectedVehicle]);
    
    const summary = useMemo(() => {
        return filteredLogs.reduce((acc, log) => {
            acc.totalCost += log.totalCost;
            acc.totalLiters += log.liters;
            return acc;
        }, { totalCost: 0, totalLiters: 0 });
    }, [filteredLogs]);

    const generatePDF = () => {
        const doc = new jspdf.jsPDF();
        const tableColumn = ["Date", "Chauffeur", "Plaque", "Odomètre (km)", "Litres", "Coût (MAD)"];
        const tableRows: (string|number)[][] = [];

        filteredLogs.forEach(log => {
            const logData = [
                new Date(log.date).toLocaleDateString('fr-FR'),
                log.driverName,
                log.plateNumber,
                log.odometer.toLocaleString('fr-FR'),
                log.liters.toFixed(2),
                log.totalCost.toFixed(2)
            ];
            tableRows.push(logData);
        });
        
        doc.setFontSize(18);
        doc.text(`Rapport de Consommation - ${city}`, 14, 22);
        doc.setFontSize(11);
        doc.text(`Période du ${new Date(startDate).toLocaleDateString('fr-FR')} au ${new Date(endDate).toLocaleDateString('fr-FR')}`, 14, 30);
        if(selectedVehicle !== 'all') {
            doc.text(`Véhicule: ${selectedVehicle}`, 14, 36);
        }

        doc.autoTable(tableColumn, tableRows, { startY: 40 });
        
        const finalY = (doc as any).lastAutoTable.finalY || 50;

        doc.setFontSize(12);
        doc.text("Résumé", 14, finalY + 10);
        doc.setFontSize(10);
        doc.text(`Coût Total: ${summary.totalCost.toFixed(2)} MAD`, 14, finalY + 16);
        doc.text(`Litres Totals: ${summary.totalLiters.toFixed(2)} L`, 14, finalY + 22);
        
        doc.save(`rapport_consommation_${city}_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Générer un Rapport</h3>
            
            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Date de début</label>
                    <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-2 py-1 mt-1 border rounded" />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Date de fin</label>
                    <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-2 py-1 mt-1 border rounded" />
                </div>
                <div>
                    <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700">Véhicule</label>
                    <select id="vehicle" value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className="w-full px-2 py-1 mt-1 border rounded">
                        <option value="all">Tous les véhicules</option>
                        {users.map(user => (
                            <option key={user.id} value={user.username}>{user.username} ({user.driverName})</option>
                        ))}
                    </select>
                </div>
                <div className="self-end">
                    <button onClick={generatePDF} className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700" disabled={filteredLogs.length === 0}>
                        Générer PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
                <div className="p-4 bg-gray-100 rounded-lg">
                    <h4 className="font-semibold text-gray-700">Coût Total</h4>
                    <p className="text-2xl font-bold">{summary.totalCost.toFixed(2)} MAD</p>
                </div>
                 <div className="p-4 bg-gray-100 rounded-lg">
                    <h4 className="font-semibold text-gray-700">Litres Consommés</h4>
                    <p className="text-2xl font-bold">{summary.totalLiters.toFixed(2)} L</p>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Chauffeur</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Plaque</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Odomètre</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Litres</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Coût</th>
                             <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredLogs.map(log => (
                            <tr key={log.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(log.date).toLocaleDateString('fr-FR')}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{log.driverName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{log.plateNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{log.odometer.toLocaleString('fr-FR')} km</td>
                                <td className="px-6 py-4 whitespace-nowrap">{log.liters.toFixed(2)} L</td>
                                <td className="px-6 py-4 whitespace-nowrap">{log.totalCost.toFixed(2)} MAD</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.status === 'approved' ? 'bg-green-100 text-green-800' : log.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {log.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredLogs.length === 0 && <p className="py-4 text-center text-gray-500">Aucune donnée pour la sélection actuelle.</p>}
            </div>
        </div>
    );
};

export default Reports;
