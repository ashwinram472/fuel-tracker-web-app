'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Trip {
  deviceId: number;
  deviceName: string;
  distance: number;
  averageSpeed: number;
  maxSpeed: number;
  spentFuel: number;
  startOdometer: number;
  endOdometer: number;
  startTime: string;
  endTime: string;
  startPositionId: number;
  endPositionId: number;
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  startAddress: string;
  endAddress: string;
  duration: number;
  driverUniqueId: number;
  driverName: string;
}

interface Vehicle {
  id: number;
  name: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  
  // Default to today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  const [startDate, setStartDate] = useState<string>(today.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(endOfDay.toISOString().split('T')[0]);
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch vehicles for dropdown
    const fetchVehicles = async () => {
      try {
        const res = await fetch('/api/vehicles');
        if (res.ok) {
          const data = await res.json();
          if (data.vehicles && data.vehicles.length > 0) {
            setVehicles(data.vehicles);
            setSelectedVehicle(data.vehicles[0].id.toString());
          }
        }
      } catch (err) {
        console.error("Failed to load vehicles", err);
      }
    };
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (!selectedVehicle || !startDate || !endDate) return;

    const fetchTrips = async () => {
      setLoading(true);
      setError(null);
      try {
        // Convert to ISO string with full time for Traccar
        const fromIso = new Date(`${startDate}T00:00:00.000Z`).toISOString();
        const toIso = new Date(`${endDate}T23:59:59.999Z`).toISOString();

        const res = await fetch(`/api/reports/trips?deviceId=${selectedVehicle}&from=${fromIso}&to=${toIso}`);
        
        if (res.status === 401) {
          router.push('/login');
          return;
        }

        if (!res.ok) throw new Error('Failed to load trips');
        
        const data = await res.json();
        // Traccar returns an array of trips
        setTrips(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [selectedVehicle, startDate, endDate, router]);

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <main className="min-h-screen bg-[var(--background)] flex flex-col text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[var(--surface)] border-b border-[var(--card-border)] sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/vehicles')} className="w-10 h-10 rounded-full bg-[var(--surface-container)] flex items-center justify-center hover:bg-[var(--outline)] transition text-[var(--text-primary)]">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
             </svg>
          </button>
          <span className="text-[20px] font-bold tracking-tight">Trip History</span>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-4xl mx-auto w-full">
        {/* Filters Panel */}
        <div className="bg-[var(--surface)] p-4 rounded-xl ambient-shadow border border-[var(--card-border)] mb-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Vehicle</label>
            <select 
              value={selectedVehicle} 
              onChange={e => setSelectedVehicle(e.target.value)}
              className="w-full bg-[var(--surface-container)] rounded-lg px-3 py-2 border border-[var(--outline)] focus:border-[var(--primary)] outline-none transition"
            >
              {vehicles.length === 0 && <option value="">Loading vehicles...</option>}
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="flex-1 md:w-40">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">From Date</label>
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-[var(--surface-container)] rounded-lg px-3 py-2 border border-[var(--outline)] focus:border-[var(--primary)] outline-none transition uppercase text-sm"
              />
            </div>
            <div className="flex-1 md:w-40">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">To Date</label>
              <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-[var(--surface-container)] rounded-lg px-3 py-2 border border-[var(--outline)] focus:border-[var(--primary)] outline-none transition uppercase text-sm"
              />
            </div>
          </div>
        </div>

        {/* Status Area */}
        {error && (
            <div className="p-4 text-[var(--error)] bg-[var(--error)] bg-opacity-10 rounded-lg mb-6 border border-[var(--error)] border-opacity-20 text-sm">
              {error}
            </div>
        )}

        {/* Trips List */}
        <div className="space-y-4">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-12 text-[var(--text-secondary)]">
                <div className="w-8 h-8 rounded-full border-y-2 border-[var(--primary)] animate-spin mb-4"></div>
                Loading trips...
             </div>
          ) : trips.length > 0 ? (
             trips.map((trip, idx) => (
               <div 
                 key={idx} 
                 onClick={() => router.push(`/history/${selectedVehicle}?from=${trip.startTime}&to=${trip.endTime}&distance=${(trip.distance / 1000).toFixed(2)}`)}
                 className="bg-[var(--surface)] p-5 rounded-xl border border-[var(--card-border)] hover:border-[var(--primary)] hover:border-opacity-50 transition-colors cursor-pointer group"
               >
                 <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-[var(--primary)] bg-opacity-10 text-[var(--primary)] flex items-center justify-center group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                     </div>
                     <div>
                       <div className="font-bold text-[18px]">{(trip.distance / 1000).toFixed(1)} km</div>
                       <div className="text-sm font-semibold text-[var(--text-secondary)]">{formatDuration(trip.duration)}</div>
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="text-sm font-medium">{new Date(trip.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</div>
                     <div className="text-xs font-semibold text-[var(--text-secondary)] bg-[var(--surface-container)] px-2 py-1 rounded-md mt-1 border border-[var(--outline)]">
                        {trip.maxSpeed > 0 ? `${Math.round(trip.maxSpeed * 1.852)} km/h max` : 'Idle'}
                     </div>
                   </div>
                 </div>

                 <div className="space-y-3 relative before:absolute before:left-[7px] before:top-4 before:bottom-4 before:w-[2px] before:bg-[var(--outline)]">
                   <div className="flex gap-4 relative z-10">
                      <div className="w-[16px] h-[16px] mt-0.5 rounded-full border-4 border-[var(--surface)] bg-[var(--success)] shadow-sm"></div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-[var(--success)] mb-0.5">{formatTime(trip.startTime)}</div>
                        <div className="text-sm text-[var(--text-secondary)] leading-snug line-clamp-2">{trip.startAddress || 'Unknown Address'}</div>
                      </div>
                   </div>
                   <div className="flex gap-4 relative z-10">
                      <div className="w-[16px] h-[16px] mt-0.5 rounded-full border-4 border-[var(--surface)] bg-[var(--error)] shadow-sm"></div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-[var(--error)] mb-0.5">{formatTime(trip.endTime)}</div>
                        <div className="text-sm text-[var(--text-secondary)] leading-snug line-clamp-2">{trip.endAddress || 'Unknown Address'}</div>
                      </div>
                   </div>
                 </div>
               </div>
             ))
          ) : (
             <div className="text-center py-20 text-[var(--text-secondary)] border border-dashed border-[var(--outline)] rounded-xl bg-[var(--surface)] bg-opacity-50">
               <svg className="mx-auto mb-4 opacity-50" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
               </svg>
               <div className="font-semibold text-lg">No trips found</div>
               <div className="text-sm">Try selecting a different date range or vehicle</div>
             </div>
          )}
        </div>
      </div>
    </main>
  );
}
