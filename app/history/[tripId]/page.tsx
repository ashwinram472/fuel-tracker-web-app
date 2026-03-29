'use client';

import { use, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const PlaybackMap = dynamic(() => import('@/components/Map/PlaybackMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-[var(--surface-container)] text-[var(--text-secondary)]">
      Loading Playback Map...
    </div>
  ),
});

export default function PlaybackPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const router = useRouter();
  
  // Unwrap Next 15 promises
  const { tripId } = use(params);
  const searchValues = use(searchParams);

  const deviceId = tripId;
  const from = searchValues.from as string;
  const to = searchValues.to as string;
  const rawDistance = searchValues.distance as string;

  const [route, setRoute] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId || !from || !to) {
      setError("Missing parameters. Cannot load route playback.");
      setLoading(false);
      return;
    }

    const fetchRoute = async () => {
      try {
        const res = await fetch(`/api/reports/route?deviceId=${deviceId}&from=${from}&to=${to}`);
        if (!res.ok) {
          if (res.status === 401) {
             router.push('/login');
             return;
          }
          throw new Error('Failed to load route data');
        }
        
        const data = await res.json();
        
        // Filter out bad coordinates like the flutter app does
        const validPoints = Array.isArray(data) 
            ? data.filter(p => p.latitude !== 0 && p.longitude !== 0)
            : [];
            
        // Sort by fixTime
        validPoints.sort((a, b) => new Date(a.fixTime).getTime() - new Date(b.fixTime).getTime());
        
        setRoute(validPoints);
      } catch (err: any) {
        setError(err.message || 'Error executing playback route load');
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [deviceId, from, to, router]);

  return (
    <main className="flex flex-col h-screen w-screen bg-[var(--background)] overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 pointer-events-none">
         <div className="flex items-start gap-3 pointer-events-auto">
           <button 
             onClick={() => router.push('/history')}
             className="w-12 h-12 bg-[var(--surface)] text-[var(--text-primary)] rounded-xl shadow-lg border border-[var(--outline)] flex items-center justify-center hover:bg-[var(--surface-container)] transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
           </button>
           <div className="bg-[var(--surface)] px-4 py-3 rounded-xl shadow-lg border border-[var(--outline)]">
             <div className="font-bold text-sm leading-tight text-[var(--text-primary)]">Playback Mode</div>
             <div className="text-xs font-semibold text-[var(--text-secondary)] mt-0.5">{rawDistance ? `${rawDistance} km` : 'Detailed Route'}</div>
           </div>
         </div>
      </div>

      {error ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center text-[var(--error)]">
          <div className="bg-[var(--error)] bg-opacity-10 border border-[var(--error)] px-6 py-4 rounded-xl">{error}</div>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-t-transparent border-[var(--primary)] rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex-1 w-full h-full relative">
          <PlaybackMap routePoints={route} vehicleId={deviceId} distance={rawDistance} />
        </div>
      )}
    </main>
  );
}
