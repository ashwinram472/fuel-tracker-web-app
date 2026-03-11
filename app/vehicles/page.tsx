"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Vehicle } from "@/lib/types";
import { Sidebar } from "@/components/Dashboard/Sidebar";
import { VehicleDetails } from "@/components/Dashboard/VehicleDetails";

// Dynamically import Map to avoid SSR issues
const FleetMap = dynamic(() => import("@/components/Map/FleetMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-900 flex items-center justify-center text-gray-500">Loading Map...</div>
});

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Listen to Real-time Tracker Data from standard GT06 bridge via internal API (bypassing Firestore Client SDK rules)
    useEffect(() => {
        let isMounted = true;

        const fetchVehicleData = async () => {
            try {
                // Prevent aggressive browser/Next.js client caching by appending timestamp and cache: no-store
                const res = await fetch(`/api/vehicles?t=${new Date().getTime()}`, {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    }
                });
                if (!res.ok) throw new Error("Failed to fetch");

                const data = await res.json();
                if (data.vehicle && isMounted) {
                    setVehicles([data.vehicle]);
                }
            } catch (err) {
                console.error("Error fetching live data:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        // Fetch immediately on load
        fetchVehicleData();

        // Then poll every 2 seconds to simulate real-time updates without triggering Firestore Client Rules
        const intervalId = setInterval(fetchVehicleData, 2000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    const selectedVehicle = useMemo(() =>
        vehicles.find(v => v.id === selectedId),
        [vehicles, selectedId]
    );

    return (
        <main className="flex h-screen w-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
            <Sidebar
                vehicles={vehicles}
                selectedId={selectedId}
                onSelect={setSelectedId}
            />

            <div className="flex-1 relative flex flex-col">
                <div className="absolute top-4 left-4 right-4 z-[500] pointer-events-none flex justify-between">
                    <div className="pointer-events-auto">
                        <span className="bg-green-600/50 text-green-200 px-2 py-1 rounded text-xs backdrop-blur-md">
                            Live GT06 Stream
                        </span>
                    </div>
                </div>

                <div className="flex-1 w-full h-full">
                    <FleetMap
                        vehicles={vehicles}
                        selectedVehicleId={selectedId}
                        onVehicleSelect={setSelectedId}
                    />
                </div>

                {selectedVehicle && (
                    <VehicleDetails
                        vehicle={selectedVehicle}
                        onClose={() => setSelectedId(null)}
                    />
                )}
            </div>
        </main>
    );
}
