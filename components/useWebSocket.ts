import { useState, useEffect, useRef } from 'react';
import { Vehicle } from '@/lib/types';
import { TraccarDevice, TraccarPosition, knotsToKmh } from '@/lib/traccar-types';

// Map Traccar payload objects back to our simple Vehicle type
function mergeDevicePosition(device: TraccarDevice, position?: TraccarPosition): Vehicle {
  return {
    id: device.id,
    name: device.name,
    uniqueId: device.uniqueId,
    category: device.category,
    latitude: position?.latitude ?? 0,
    longitude: position?.longitude ?? 0,
    speed: position ? knotsToKmh(position.speed) : 0,
    course: position?.course ?? 0,
    status: device.status as 'online' | 'offline' | 'unknown',
    address: position?.address ?? null,
    lastUpdate: device.lastUpdate ?? null,
    fixTime: position?.fixTime ?? null,
    attributes: { ...device.attributes, ...position?.attributes },
  };
}

export function useTraccarSocket() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let active = true;

    // We maintain internal maps to easily merge devices and positions
    const deviceMap = new Map<number, TraccarDevice>();
    const positionMap = new Map<number, TraccarPosition>();

    // Initial fetch to populate map before socket starts streaming
    const fetchInitial = async () => {
      try {
        const res = await fetch(`/api/vehicles?t=${Date.now()}`);
        if (!res.ok) throw new Error('Failed to fetch initial state');
        const data = await res.json();
        const initialVehicles: Vehicle[] = data.vehicles || [];
        
        if (active) {
            setVehicles(initialVehicles);
            
            // Re-populate internal maps from the fetched vehicles
            // (We mock TraccarDevice/Position just enough so updates can merge over them)
            initialVehicles.forEach(v => {
                deviceMap.set(v.id, {
                    id: v.id, name: v.name, status: v.status, lastUpdate: v.lastUpdate,
                    uniqueId: '', positionId: null, category: null, model: null, attributes: {}
                });
                positionMap.set(v.id, {
                    id: 0, deviceId: v.id, latitude: v.latitude, longitude: v.longitude,
                    speed: v.speed / 1.852, course: v.course, address: v.address,
                    protocol: '', deviceTime: '', fixTime: '', serverTime: '', valid: true, altitude: 0, accuracy: 0, attributes: {}
                });
            });

            setLoading(false);
            connectWebSocket();
        }
      } catch (e: any) {
        if (active) {
            setError(e.message);
            setLoading(false);
        }
      }
    };

    const connectWebSocket = () => {
      // Determine protocol: ws:// for http://, wss:// for https://
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}/api/socket`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Traccar WebSocket connected');
        if (active) setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          let stateChanged = false;

          // Process incoming devices
          if (data.devices && Array.isArray(data.devices)) {
            data.devices.forEach((d: TraccarDevice) => {
              deviceMap.set(d.id, d);
              stateChanged = true;
            });
          }

          // Process incoming positions
          if (data.positions && Array.isArray(data.positions)) {
            data.positions.forEach((p: TraccarPosition) => {
              positionMap.set(p.deviceId, p);
              stateChanged = true;
            });
          }

          // Generate updated vehicles array if anything changed
          if (stateChanged && active) {
            const updatedVehicles = Array.from(deviceMap.values()).map(device => 
              mergeDevicePosition(device, positionMap.get(device.id))
            );
            setVehicles(updatedVehicles);
          }
        } catch (e) {
          console.error('Error parsing Traccar socket message', e);
        }
      };

      ws.onclose = () => {
        console.log('Traccar WebSocket disconnected');
        if (active) {
          setIsConnected(false);
          // Try to reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        }
      };

      ws.onerror = (e) => {
        console.error('Traccar WebSocket error:', e);
        // Will trigger onclose and reconnect logic
      };
    };

    fetchInitial();

    return () => {
      active = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return { vehicles, loading, error, isConnected };
}
