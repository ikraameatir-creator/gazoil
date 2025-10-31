import React, { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { FuelLog, City, LogStatus } from '../types';

const getLocalStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch {
        return defaultValue;
    }
};

interface FuelDataContextType {
    getFuelLogs: (city: City) => FuelLog[];
    getLogsByPlate: (plate: string, city: City) => FuelLog[];
    addFuelLog: (log: Omit<FuelLog, 'id' | 'status' | 'rejectionReason'>, city: City) => Promise<void>;
    updateLogStatus: (logId: number, status: LogStatus, city: City, reason?: string) => void;
    updateLog: (updatedLog: FuelLog, city: City) => void;
    getLastOdometer: (plate: string, city: City) => number;
}

const FuelDataContext = createContext<FuelDataContextType | undefined>(undefined);

export const FuelDataProvider: React.FC<{children: ReactNode}> = ({children}) => {
    const [fuelLogs, setFuelLogs] = useState<Record<City, FuelLog[]>>(() => {
        const saleLogs = getLocalStorage<FuelLog[]>(`fuelLogs_Salé`, []);
        const zemamraLogs = getLocalStorage<FuelLog[]>(`fuelLogs_Zemamra`, []);
        return { 'Salé': saleLogs, 'Zemamra': zemamraLogs };
    });

    useEffect(() => {
        localStorage.setItem(`fuelLogs_Salé`, JSON.stringify(fuelLogs['Salé']));
        localStorage.setItem(`fuelLogs_Zemamra`, JSON.stringify(fuelLogs['Zemamra']));
    }, [fuelLogs]);
    
    const getFuelLogs = (city: City) => fuelLogs[city] || [];
    const getLogsByPlate = (plate: string, city: City) => (fuelLogs[city] || []).filter(log => log.plateNumber === plate);

    const getLastOdometer = (plate: string, city: City) => {
        const vehicleLogs = getLogsByPlate(plate, city)
            .filter(log => log.status === 'approved')
            .sort((a, b) => b.odometer - a.odometer);
        return vehicleLogs.length > 0 ? vehicleLogs[0].odometer : 0;
    };

    const addFuelLog = async (log: Omit<FuelLog, 'id' | 'status' | 'rejectionReason'>, city: City) => {
        const lastOdometer = getLastOdometer(log.plateNumber, city);
        if (log.odometer < lastOdometer) {
            throw new Error(`Le kilométrage doit être supérieur à ${lastOdometer} km.`);
        }
        const newLog: FuelLog = { ...log, id: Date.now(), status: 'pending' };
        setFuelLogs(prev => {
            const cityLogs = [newLog, ...(prev[city] || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return {...prev, [city]: cityLogs};
        });
    };
    
    const updateLog = (updatedLog: FuelLog, city: City) => {
        const lastOdometer = getLastOdometer(updatedLog.plateNumber, city);
        if (updatedLog.odometer < lastOdometer) {
            // Note: In a real app, you might want more nuanced validation for edits.
            // For now, we keep the rule simple.
            const logBeforeEdit = getLogsByPlate(updatedLog.plateNumber, city).find(l => l.id === updatedLog.id);
            if(logBeforeEdit && updatedLog.odometer < logBeforeEdit.odometer){
                 throw new Error(`Le kilométrage doit être supérieur au précédent.`);
            }
        }
        setFuelLogs(prev => ({
            ...prev,
            [city]: prev[city].map(log => log.id === updatedLog.id ? {...updatedLog, status: 'pending'} : log)
        }));
    };

    const updateLogStatus = (logId: number, status: LogStatus, city: City, reason?: string) => {
        setFuelLogs(prev => ({
            ...prev,
            [city]: prev[city].map(log => log.id === logId ? { ...log, status, rejectionReason: reason } : log)
        }));
    };

    return (
        <FuelDataContext.Provider value={{ getFuelLogs, getLogsByPlate, addFuelLog, updateLogStatus, updateLog, getLastOdometer }}>
            {children}
        </FuelDataContext.Provider>
    );
};

export const useFuelData = () => {
    const context = useContext(FuelDataContext);
    if (context === undefined) {
        throw new Error('useFuelData must be used within a FuelDataProvider');
    }
    return context;
};
