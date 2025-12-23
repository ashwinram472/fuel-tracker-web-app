"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type VehicleRow = {
    id: string;
    name: string;
    latestFuelPct: number;
    lastSeenAt?: Timestamp;
};

function fmt(ts?: Timestamp) {
    return ts ? ts.toDate().toLocaleString() : "—";
}

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, "fleets", "demoFleet", "vehicles"));

        const unsub = onSnapshot(
            q,
            (snap) => {
                const rows: VehicleRow[] = snap.docs.map((d) => {
                    const data = d.data() as any;
                    return {
                        id: d.id,
                        name: data.name ?? d.id,
                        latestFuelPct: Number(data.latestFuelPct ?? 0),
                        lastSeenAt: data.lastSeenAt,
                    };
                });
                setVehicles(rows);
                setError(null);
            },
            (e) => setError(e.message)
        );

        return () => unsub();
    }, []);

    return (
        <main style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
            <h1 style={{ fontSize: 28, fontWeight: 700 }}>Vehicles</h1>

            {error && (
                <div style={{ marginTop: 12, padding: 12, border: "1px solid #f99" }}>
                    Error: {error}
                </div>
            )}

            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
                {vehicles.map((v) => (
                    <div
                        key={v.id}
                        style={{ padding: 14, border: "1px solid #ddd", borderRadius: 10 }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>{v.name}</div>
                                <div style={{ fontSize: 13, opacity: 0.7 }}>
                                    Last updated: {fmt(v.lastSeenAt)}
                                </div>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: 18 }}>
                                {v.latestFuelPct}%
                            </div>
                        </div>
                    </div>
                ))}

                {vehicles.length === 0 && !error && (
                    <div style={{ opacity: 0.7 }}>
                        No vehicles yet. Add docs under{" "}
                        <code>fleets/demoFleet/vehicles</code> in Firestore.
                    </div>
                )}
            </div>
        </main>
    );
}
