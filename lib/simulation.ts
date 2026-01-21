import { Vehicle, Location, VehicleStatus } from "./types";
import { Timestamp } from "firebase/firestore";

// Helper: Distance between two points (Haversine roughly or simple Euclidean for short dists)
function getDistance(p1: Location, p2: Location) {
  const R = 6371e3; // metres
  const φ1 = (p1.lat * Math.PI) / 180;
  const φ2 = (p2.lat * Math.PI) / 180;
  const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
  const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

// Helper: Bearing
function getBearing(start: Location, end: Location) {
  const startLat = (start.lat * Math.PI) / 180;
  const startLng = (start.lng * Math.PI) / 180;
  const endLat = (end.lat * Math.PI) / 180;
  const endLng = (end.lng * Math.PI) / 180;

  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) -
        Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
  const θ = Math.atan2(y, x);
  const brng = (θ * 180) / Math.PI;
  return (brng + 360) % 360;
}

// India Bounds (Approx for demo - focus on Maharashtra/Karnataka region for density)
// Lat: 18.0 - 20.0, Lng: 72.0 - 75.0
const BOUNDS = {
  minLat: 18.5,
  maxLat: 19.5,
  minLng: 72.8,
  maxLng: 74.5
};

export function generateInitialVehicles(count: number): any[] {
  const vehicles = [];
  for (let i = 0; i < count; i++) {
    const start: Location = {
      lat: BOUNDS.minLat + Math.random() * (BOUNDS.maxLat - BOUNDS.minLat),
      lng: BOUNDS.minLng + Math.random() * (BOUNDS.maxLng - BOUNDS.minLng),
    };
    const dest: Location = {
      lat: BOUNDS.minLat + Math.random() * (BOUNDS.maxLat - BOUNDS.minLat),
      lng: BOUNDS.minLng + Math.random() * (BOUNDS.maxLng - BOUNDS.minLng),
    };

    vehicles.push({
      name: `Truck ${1000 + i}`,
      type: Math.random() > 0.8 ? 'van' : 'truck',
      status: 'moving',
      location: start,
      destination: dest,
      heading: getBearing(start, dest),
      speed: 0,
      fuelLevel: 60 + Math.random() * 40, // 60-100L
      fuelCapacity: 100,
      fuelConsumptionRate: 0.15, // L/km
      odometer: 10000 + Math.random() * 50000,
      safetyScore: 95,
      maintenanceStatus: 'good',
      co2Emissions: 0,
      zone: 'Transit',
      lastSeenAt: Timestamp.now(),
      alerts: {},
    });
  }
  return vehicles;
}

export function updateVehicleState(v: Vehicle): Vehicle {
  const now = Timestamp.now();
  const newState = { ...v, lastSeenAt: now };

  // 1. Movement Logic
  if (newState.status === 'moving' && newState.destination) {
    const dist = getDistance(newState.location, newState.destination);

    if (dist < 100) {
      // Reached destination, pick new one
      newState.destination = {
        lat: BOUNDS.minLat + Math.random() * (BOUNDS.maxLat - BOUNDS.minLat),
        lng: BOUNDS.minLng + Math.random() * (BOUNDS.maxLng - BOUNDS.minLng),
      };
      // Brief idle
      // newState.status = 'idle';
    } else {
      // Move towards destination
      // Speed varies: 30-80 km/h
      const targetSpeed = 40 + Math.random() * 40;
      // Smooth acceleration could be implemented here, but simple set for now
      newState.speed = targetSpeed;

      const distanceToMove = (newState.speed * 1000 / 3600) * 5; // moved in 5 seconds (assuming 5s loop)

      // Calculate new lat/lng
      const bearing = getBearing(newState.location, newState.destination);
      newState.heading = bearing;

      const R = 6371e3;
      const φ1 = (newState.location.lat * Math.PI) / 180;
      const λ1 = (newState.location.lng * Math.PI) / 180;
      const brng = (bearing * Math.PI) / 180;
      const d = distanceToMove;

      const φ2 = Math.asin( Math.sin(φ1)*Math.cos(d/R) +
                    Math.cos(φ1)*Math.sin(d/R)*Math.cos(brng) );
      const λ2 = λ1 + Math.atan2(Math.sin(brng)*Math.sin(d/R)*Math.cos(φ1),
                           Math.cos(d/R)-Math.sin(φ1)*Math.sin(φ2));

      newState.location = {
        lat: (φ2 * 180) / Math.PI,
        lng: (λ2 * 180) / Math.PI
      };

      // 2. Fuel Consumption
      const fuelConsumed = (distanceToMove / 1000) * newState.fuelConsumptionRate;
      newState.fuelLevel = Math.max(0, newState.fuelLevel - fuelConsumed);

      // 3. CO2 Emissions (approx 2.6kg per liter of diesel)
      newState.co2Emissions += fuelConsumed * 2.6;
      newState.odometer += (distanceToMove / 1000);
    }
  }

  // 4. Random Events

  // Fuel Theft Simulation (Very rare)
  if (Math.random() < 0.005 && newState.fuelLevel > 10) {
     newState.fuelLevel -= 5; // Drop 5 liters instantly
     newState.alerts = { ...newState.alerts, fuelTheft: true };
     // Reset alert after some time? Use UI to dismiss usually, but for sim we leave it
  } else {
     // Clear old theft alert if it's been a while?
     // For simplicity, we toggle it off if not happening,
     // but in real app we'd keep a log.
     // Let's just randomly clear it to simulate "acknowledged"
     if (Math.random() < 0.1) {
        const { fuelTheft, ...rest } = newState.alerts || {};
        newState.alerts = rest;
     }
  }

  // Safety Score Logic
  // Random "hard brake" or "speeding"
  if (newState.speed > 80) {
    newState.safetyScore = Math.max(0, newState.safetyScore - 1);
  } else {
    newState.safetyScore = Math.min(100, newState.safetyScore + 0.1);
  }

  // Maintenance
  if (newState.odometer > 59000) {
    newState.maintenanceStatus = 'critical';
  } else if (newState.odometer > 55000) {
    newState.maintenanceStatus = 'warning';
  } else {
    newState.maintenanceStatus = 'good';
  }

  return newState;
}
