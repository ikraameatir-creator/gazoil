
export type Role = 'admin' | 'driver';
export type City = 'Salé' | 'Zemamra';
export type LogStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: number;
  // Le nom d'utilisateur EST la plaque d'immatriculation pour les chauffeurs
  username: string; 
  password?: string;
  role: Role;
  // Propriétés spécifiques au chauffeur/véhicule
  driverName?: string; 
  phone?: string;
  city?: City;
}

export interface FuelLog {
  id: number;
  // Remplacer vehicleId et driverId par la plaque, qui est l'identifiant unique
  plateNumber: string; 
  driverName: string;
  city: City;
  date: string; // ISO format string
  odometer: number;
  liters: number; 
  totalCost: number; 
  receiptPhotos?: string[]; // base64 string array
  remarks?: string;
  // Pour le système de validation
  status: LogStatus;
  rejectionReason?: string;
}