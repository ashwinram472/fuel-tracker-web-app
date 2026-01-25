"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { isFirebaseConfigured } from "@/lib/firebase";
import { Sidebar } from "@/components/Dashboard/Sidebar";
import { VehicleDetails } from "@/components/Dashboard/VehicleDetails";
import { useFleet } from "@/hooks/useFleet";

// Dynamically import Map to avoid SSR issues
const FleetMap = dynamic(() => import("@/components/Map/FleetMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900 flex items-center justify-center text-gray-500">Loading Map...</div>
});

export default function VehiclesPage() {
    const { vehicles, loading, isSimulating, setIsSimulating, seedFleet } = useFleet();
    const [selectedId, setSelectedId] = useState<string | null>(null);

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
                        {!isFirebaseConfigured && (
                            <span className="bg-yellow-600/50 text-yellow-200 px-2 py-1 rounded text-xs backdrop-blur-md">
                                Local Demo Mode
                            </span>
                        )}
                    </div>
                    <div className="pointer-events-auto flex gap-2">
                        {(vehicles.length === 0 && !loading) && (
                            <button
                                onClick={() => seedFleet(5)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-lg text-sm font-bold transition cursor-pointer"
                            >
                                Initialize Fleet
                            </button>
                        )}
                        <button
                            onClick={() => setIsSimulating(!isSimulating)}
                            className={`
                                px-4 py-2 rounded shadow-lg text-sm font-bold transition cursor-pointer
                                ${isSimulating ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}
                            `}
                        >
                            {isSimulating ? 'Simulation Active' : 'Start Simulation'}
                        </button>
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
