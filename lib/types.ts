import { Timestamp } from "firebase/firestore";

export type VehicleStatus = 'moving' | 'idle' | 'stopped' | 'offline';
export type MaintenanceStatus = 'good' | 'warning' | 'critical';

export interface Location {
  lat: number;
  lng: number;
}

export interface Vehicle {
  id: string;
  name: string;
  type: 'truck' | 'van'; // For icon selection
  status: VehicleStatus;

  // Location & Movement
  location: Location;
  heading: number; // 0-360
  speed: number; // km/h
  destination?: Location;

  // Fuel & Engine
  fuelLevel: number; // liters
  fuelCapacity: number; // liters
  fuelConsumptionRate: number; // liters per km (avg)
  odometer: number; // km

  // Unique Features
  safetyScore: number; // 0-100
  maintenanceStatus: MaintenanceStatus;
  co2Emissions: number; // total kg
  zone?: string; // e.g., "North Zone", "Warehouse A"

  lastSeenAt: Timestamp;
  lastExternalUpdate?: Timestamp; // Last time we heard from the physical tracker
  rawSensorPayload?: any; // Store raw data for debugging

  // Alerts (transient or persistent)
  alerts?: {
    fuelTheft?: boolean;
    accident?: boolean;
    maintenance?: boolean;
  };
}
