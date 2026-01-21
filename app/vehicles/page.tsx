"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { collection, onSnapshot, doc, writeBatch } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Vehicle } from "@/lib/types";
import { generateInitialVehicles, updateVehicleState } from "@/lib/simulation";
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
    const [isSimulating, setIsSimulating] = useState(false);
    const [loading, setLoading] = useState(true);

    // 1. Listen to Real-time Data OR Local Fallback
    useEffect(() => {
        if (isFirebaseConfigured && db) {
            const q = collection(db, "fleets", "demoFleet", "vehicles");
            const unsub = onSnapshot(q, (snap) => {
                const rows: Vehicle[] = snap.docs.map((d) => ({
                    id: d.id,
                    ...d.data()
                } as Vehicle));
                setVehicles(rows);
                setLoading(false);
            });
            return () => unsub();
        } else {
            console.warn("Firebase not configured. Using local state mode.");
            setLoading(false);
        }
    }, []);

    // 2. Simulation Loop
    useEffect(() => {
        if (!isSimulating) return;

        const interval = setInterval(async () => {
            // Logic for both: Update logic is same, storage differs.
            if (isFirebaseConfigured && db) {
                const batch = writeBatch(db);
                let updatesCount = 0;
                vehicles.forEach(v => {
                    const nextState = updateVehicleState(v);
                    const ref = doc(db, "fleets", "demoFleet", "vehicles", v.id);
                    batch.set(ref, nextState);
                    updatesCount++;
                });
                if (updatesCount > 0) await batch.commit();
            } else {
                // Local Mode Update
                setVehicles(prev => prev.map(v => updateVehicleState(v)));
            }
        }, 1000); // 1 second update rate for smoother local demo

        return () => clearInterval(interval);
    }, [isSimulating, vehicles]);

    // 3. Initial Seeding Handler
    const handleSeed = async () => {
        setLoading(true);
        const initialData = generateInitialVehicles(5);

        if (isFirebaseConfigured && db) {
            const batch = writeBatch(db);
            initialData.forEach((v, i) => {
                const id = `TRUCK-${100 + i}`;
                const ref = doc(db, "fleets", "demoFleet", "vehicles", id);
                batch.set(ref, v);
            });
            await batch.commit();
        } else {
            // Local Seed
            const localVehicles = initialData.map((v, i) => ({
                ...v,
                id: `TRUCK-${100 + i}`
            }));
            setVehicles(localVehicles);
        }
        setLoading(false);
    };

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
                                onClick={handleSeed}
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
