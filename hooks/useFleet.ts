"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, writeBatch } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Vehicle } from "@/lib/types";
import { generateInitialVehicles, updateVehicleState } from "@/lib/simulation";

export function useFleet() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isSimulating, setIsSimulating] = useState(false);
    const [loading, setLoading] = useState(true);

    // 1. Listen to Real-time Data OR Local Fallback
    useEffect(() => {
        if (isFirebaseConfigured && db) {
            const q = collection(db, "fleets", "demoFleet", "vehicles");
            const unsub = onSnapshot(q, (snap) => {
                const rows: Vehicle[] = snap.docs.map((d) => {
                    const data = d.data();
                    // Ensure robust default values
                    return {
                        id: d.id,
                        name: data.name ?? `Vehicle ${d.id}`,
                        type: data.type ?? 'truck',
                        status: data.status ?? 'offline',
                        location: data.location ?? { lat: 19.0760, lng: 72.8777 },
                        heading: data.heading ?? 0,
                        speed: data.speed ?? 0,
                        destination: data.destination,
                        fuelLevel: data.fuelLevel ?? 0,
                        fuelCapacity: data.fuelCapacity ?? 100,
                        fuelConsumptionRate: data.fuelConsumptionRate ?? 0.2,
                        odometer: data.odometer ?? 0,
                        safetyScore: data.safetyScore ?? 100,
                        maintenanceStatus: data.maintenanceStatus ?? 'good',
                        co2Emissions: data.co2Emissions ?? 0,
                        zone: data.zone ?? 'Unknown',
                        lastSeenAt: data.lastSeenAt,
                        alerts: data.alerts ?? {}
                    } as Vehicle;
                });
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
    const seedFleet = async (count: number = 5) => {
        setLoading(true);
        const initialData = generateInitialVehicles(count);

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

    return {
        vehicles,
        loading,
        isSimulating,
        setIsSimulating,
        seedFleet
    };
}
