import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { Vehicle } from '@/lib/types';

export async function POST(request: Request) {
    if (!db) {
        return NextResponse.json({ error: 'Firebase not configured' }, { status: 503 });
    }

    try {
        const body = await request.json();
        const { vehicleId, lat, lng, speed, fuelLevel, timestamp, ...rest } = body;

        if (!vehicleId) {
            return NextResponse.json({ error: 'Missing vehicleId' }, { status: 400 });
        }

        const vehicleRef = doc(db, 'fleets', 'demoFleet', 'vehicles', vehicleId);

        const updateData: Partial<Vehicle> & { [key: string]: any } = {
            lastExternalUpdate: Timestamp.now(),
            rawSensorPayload: body,
            ...(lat !== undefined && lng !== undefined && {
                location: { lat: Number(lat), lng: Number(lng) }
            }),
            ...(speed !== undefined && { speed: Number(speed) }),
            ...(fuelLevel !== undefined && { fuelLevel: Number(fuelLevel) }),
        };

        // Determine status based on speed if available
        if (speed !== undefined) {
            // Simple logic: > 0 is moving, else idle/stopped
            updateData.status = Number(speed) > 0 ? 'moving' : 'idle';
        }

        if (timestamp) {
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
                updateData.lastSeenAt = Timestamp.fromDate(date);
            } else {
                updateData.lastSeenAt = Timestamp.now();
            }
        } else {
            updateData.lastSeenAt = Timestamp.now();
        }

        // Use setDoc with merge: true to update or create
        await setDoc(vehicleRef, updateData, { merge: true });

        return NextResponse.json({ success: true, vehicleId });
    } catch (error) {
        console.error('Ingest error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
