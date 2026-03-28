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

import { cookies } from 'next/headers';

async function traccarFetch(endpoint: string): Promise<Response> {
  const url = `${TRACCAR_URL}${endpoint}`;
  
  // Retrieve user session cookie if it exists
  const cookieStore = await cookies();
  const jsessionId = cookieStore.get('JSESSIONID')?.value;
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  // If user is logged in natively via our /login form
  if (jsessionId) {
    headers['Cookie'] = `JSESSIONID=${jsessionId}`;
  } else {
    // Fall back to universal service account if no user is signed in 
    // (Note: in a strict multi-tenant setup, you might throw an error here instead)
    headers['Authorization'] = getAuthHeader();
  }

  const res = await fetch(url, {
    headers,
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
