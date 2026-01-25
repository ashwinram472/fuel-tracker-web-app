import { describe, it, expect, vi } from 'vitest';
import { generateInitialVehicles, updateVehicleState } from './simulation';
import { Vehicle } from './types';

// Mock Firebase Timestamp
vi.mock('firebase/firestore', () => ({
  Timestamp: {
    now: () => ({ seconds: 1672531200, nanoseconds: 0 }), // Fixed time
  },
}));

describe('Simulation Logic', () => {
  describe('generateInitialVehicles', () => {
    it('should generate the requested number of vehicles', () => {
      const vehicles = generateInitialVehicles(5);
      expect(vehicles).toHaveLength(5);
    });

    it('should have valid initial properties', () => {
      const vehicles = generateInitialVehicles(1);
      const v = vehicles[0];
      expect(v.status).toBe('moving');
      expect(v.fuelLevel).toBeGreaterThan(0);
      expect(v.location).toBeDefined();
      expect(v.destination).toBeDefined();
    });
  });

  describe('updateVehicleState', () => {
    const mockVehicle: Vehicle = {
      id: 'test-1',
      name: 'Test Truck',
      type: 'truck',
      status: 'moving',
      location: { lat: 10, lng: 10 },
      destination: { lat: 10.1, lng: 10.1 }, // Far enough to move
      heading: 0,
      speed: 50,
      fuelLevel: 50,
      fuelCapacity: 100,
      fuelConsumptionRate: 0.2, // 0.2 L/km
      odometer: 1000,
      safetyScore: 100,
      maintenanceStatus: 'good',
      co2Emissions: 0,
      lastSeenAt: { seconds: 0, nanoseconds: 0 } as any,
      alerts: {},
    };

    it('should move the vehicle towards destination', () => {
      const newState = updateVehicleState(mockVehicle);
      // It should have moved from 10,10
      expect(newState.location.lat).not.toBe(10);
      expect(newState.location.lng).not.toBe(10);
    });

    it('should consume fuel when moving', () => {
      const newState = updateVehicleState(mockVehicle);
      expect(newState.fuelLevel).toBeLessThan(mockVehicle.fuelLevel);
    });

    it('should increase odometer when moving', () => {
      const newState = updateVehicleState(mockVehicle);
      expect(newState.odometer).toBeGreaterThan(mockVehicle.odometer);
    });

    it('should trigger maintenance warning if odometer is high', () => {
        const wornVehicle: Vehicle = { ...mockVehicle, odometer: 56000 };
        const newState = updateVehicleState(wornVehicle);
        expect(newState.maintenanceStatus).toBe('warning');
    });

     it('should trigger maintenance critical if odometer is very high', () => {
        const wornVehicle: Vehicle = { ...mockVehicle, odometer: 60000 };
        const newState = updateVehicleState(wornVehicle);
        expect(newState.maintenanceStatus).toBe('critical');
    });
  });
});
