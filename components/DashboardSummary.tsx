
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FuelLog, User } from '../types';
import FuelLogItem from './FuelLogItem';

// Make TypeScript aware of the Chart.js library loaded from CDN
declare const Chart: any;

interface DashboardSummaryProps {
    logs: (FuelLog & { distance: number })[];
    onApprove: (logId: number) => void;
    onReject: (logId: number) => void;
    findDriver: (plate: string) => User | undefined;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex items-center">
            <div className="flex-shrink-0 p-3 text-white bg-blue-500 rounded-md">
                {icon}
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    </div>
);


const DashboardSummary: React.FC<DashboardSummaryProps> = ({ logs, onApprove, onReject, findDriver }) => {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const [startDate, setStartDate] = useState(thirtyDaysAgo);
    const [endDate, setEndDate] = useState(today);

    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    const filteredLogs = useMemo(() => {
        return logs
            .filter(log => {
                const logDate = new Date(log.date);
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                return logDate >= start && logDate <= end;
            });
    }, [logs, startDate, endDate]);

    const summary = useMemo(() => {
        return filteredLogs.reduce((acc, log) => {
            acc.totalCost += log.totalCost;
            acc.totalLiters += log.liters;
            acc.totalDistance += log.distance || 0;
            if (log.status === 'pending') {
                acc.pendingLogs++;
            }
            return acc;
        }, { totalCost: 0, totalLiters: 0, totalDistance: 0, pendingLogs: 0 });
    }, [filteredLogs]);
    
    const pendingLogs = useMemo(() => {
        return logs
            .filter(log => log.status === 'pending')
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5); // Show latest 5
    }, [logs]);

    useEffect(() => {
        if (!chartRef.current) return;
        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        // Group data by day
        const dataByDay = filteredLogs.reduce((acc, log) => {
            const day = new Date(log.date).toISOString().split('T')[0];
            if (!acc[day]) {
                acc[day] = 0;
            }
            acc[day] += log.totalCost;
            return acc;
        }, {} as Record<string, number>);

        const sortedDays = Object.keys(dataByDay).sort();
        const chartLabels = sortedDays.map(day => new Date(day).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit'}));
        const chartData = sortedDays.map(day => dataByDay[day]);
        
        // Destroy previous chart instance before creating a new one
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        chartInstanceRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Coût par jour (MAD)',
                    data: chartData,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

    }, [filteredLogs]);

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center p-4 space-x-4 bg-white rounded-lg shadow">
                 <h3 className="text-lg font-semibold text-gray-800">Période d'analyse :</h3>
                <div>
                    <label htmlFor="startDate" className="sr-only">Date de début</label>
                    <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-2 py-1 border rounded" />
                </div>
                <span className="text-gray-500">-</span>
                <div>
                    <label htmlFor="endDate" className="sr-only">Date de fin</label>
                    <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-2 py-1 border rounded" />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Coût Total" value={`${summary.totalCost.toFixed(2)} MAD`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} />
                <StatCard title="Litres Consommés" value={`${summary.totalLiters.toFixed(2)} L`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>} />
                <StatCard title="Distance Parcourue" value={`${summary.totalDistance.toLocaleString('fr-FR')} km`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
                <StatCard title="Déclarations en Attente" value={String(summary.pendingLogs)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            </div>
            
            {/* Chart */}
            <div className="p-4 bg-white rounded-lg shadow">
                 <h3 className="text-lg font-semibold text-gray-800 mb-4">Évolution des coûts</h3>
                <div className="relative h-72">
                    <canvas ref={chartRef}></canvas>
                </div>
            </div>

            {/* Pending Logs */}
            {pendingLogs.length > 0 && (
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Dernières déclarations en attente</h3>
                    <ul className="space-y-4">
                        {pendingLogs.map(log => (
                             <FuelLogItem 
                                key={log.id} 
                                log={log} 
                                driver={findDriver(log.plateNumber)}
                                distance={log.distance > 0 ? log.distance : undefined}
                                onApprove={() => onApprove(log.id)}
                                onReject={() => onReject(log.id)}
                            />
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default DashboardSummary;
