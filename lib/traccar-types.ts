export interface TraccarDevice {
  id: number;
  name: string;
  uniqueId: string;
  status: string; // 'online' | 'offline' | 'unknown'
  lastUpdate: string | null;
  positionId: number | null;
  category: string | null;
  model: string | null;
  attributes: Record<string, unknown>;
}

export interface TraccarPosition {
  id: number;
  deviceId: number;
  protocol: string;
  deviceTime: string;
  fixTime: string;
  serverTime: string;
  valid: boolean;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number; // in knots
  course: number; // heading 0-360
  address: string | null;
  accuracy: number;
  attributes: Record<string, unknown>;
}

/** Knots → km/h */
export function knotsToKmh(knots: number): number {
  return knots * 1.852;
}
