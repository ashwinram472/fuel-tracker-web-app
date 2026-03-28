// Traccar API client — server-side only
// Uses BasicAuth to authenticate with the Traccar server at gps.flytr.in

import https from 'node:https';

const TRACCAR_URL = process.env.TRACCAR_API_URL || 'https://app.flytr.in';
const TRACCAR_EMAIL = process.env.TRACCAR_EMAIL || '';
const TRACCAR_PASSWORD = process.env.TRACCAR_PASSWORD || '';

// Bypass self-signed TLS certificate on the Traccar server
const agent = new https.Agent({ rejectUnauthorized: false });

function getAuthHeader(): string {
  return 'Basic ' + Buffer.from(`${TRACCAR_EMAIL}:${TRACCAR_PASSWORD}`).toString('base64');
}

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

async function traccarFetch(endpoint: string): Promise<Response> {
  // Use node-fetch-compatible approach for self-signed certs
  const url = `${TRACCAR_URL}${endpoint}`;

  // Node 18+ native fetch doesn't support agent directly
  // Use the undici dispatcher approach or fall back to http module
  const res = await fetch(url, {
    headers: {
      'Authorization': getAuthHeader(),
      'Accept': 'application/json',
    },
    // @ts-expect-error - Next.js extends fetch with Node options
    agent,
  });

  return res;
}

export async function getDevices(): Promise<TraccarDevice[]> {
  try {
    const res = await traccarFetch('/api/devices');

    if (!res.ok) {
      console.error('Traccar devices error:', res.status, await res.text());
      return [];
    }

    return await res.json();
  } catch (e) {
    console.error('Traccar devices fetch error:', e);
    return [];
  }
}

export async function getPositions(): Promise<TraccarPosition[]> {
  try {
    const res = await traccarFetch('/api/positions');

    if (!res.ok) {
      console.error('Traccar positions error:', res.status, await res.text());
      return [];
    }

    return await res.json();
  } catch (e) {
    console.error('Traccar positions fetch error:', e);
    return [];
  }
}

/** Knots → km/h */
export function knotsToKmh(knots: number): number {
  return knots * 1.852;
}
