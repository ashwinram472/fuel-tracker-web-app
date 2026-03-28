export type VehicleStatus = 'online' | 'offline' | 'unknown';

export interface Vehicle {
  id: number;
  name: string;
  uniqueId: string;
  status: VehicleStatus;
  category: string | null;

  // Position data (from Traccar positions API)
  latitude: number;
  longitude: number;
  speed: number;    // km/h (converted from knots)
  course: number;   // heading 0-360
  address: string | null;

  // Timestamps
  lastUpdate: string | null;
  fixTime: string | null;

  // Raw attributes from Traccar
  attributes: Record<string, unknown>;
}
