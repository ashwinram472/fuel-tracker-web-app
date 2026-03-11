import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin loosely. 
// Next.js hot-reloading can cause multiple initializations
if (!admin.apps.length) {
    let credential;
    try {
        // In local dev, try picking up the service account
        const serviceAccount = require('@/serviceAccountKey.json');
        credential = admin.credential.cert(serviceAccount);
    } catch (e) {
        console.warn("No serviceAccountKey.json found in API route, falling back to application default credentials.");
        credential = admin.credential.applicationDefault();
    }

    try {
        admin.initializeApp({
            credential,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
    } catch (err) {
        console.error("Firebase Admin Init Error:", err);
    }
}

const db = admin.firestore();

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Use Admin SDK to bypass Firestore client security rules
        const docSnap = await db.collection("vehicle_logs").doc("latest_Vento").get();

        if (!docSnap.exists) {
            return NextResponse.json({ vehicle: null });
        }

        const data = docSnap.data();
        if (!data) return NextResponse.json({ vehicle: null });

        // Format to match the Vehicle interface expected by the frontend
        const vehicle = {
            id: data.vehicleId || "Vento",
            name: "Vento",
            type: "car",
            status: data.speed > 0 ? "moving" : (data.ignition ? "idle" : "offline"),
            location: data.location || { lat: 19.0760, lng: 72.8777 },
            heading: data.heading ?? 0,
            speed: data.speed ?? 0,
            fuelLevel: 45,
            fuelCapacity: 55,
            odometer: 12500,
            lastSeenAt: data.lastSeenAt ? data.lastSeenAt.toDate().toISOString() : null,
            alerts: {},
        };

        return NextResponse.json({ vehicle });
    } catch (error: any) {
        console.error("Admin API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
