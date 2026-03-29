import { NextResponse } from 'next/server';
import { getDevices, getPositions } from '@/lib/traccar';
import { knotsToKmh } from '@/lib/traccar-types';
import { Vehicle } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [devices, positions] = await Promise.all([
            getDevices(),
            getPositions(),
        ]);

        // Build a map of deviceId → position for fast lookup
        const positionMap = new Map(positions.map(p => [p.deviceId, p]));

        const vehicles: Vehicle[] = devices.map(device => {
            const pos = positionMap.get(device.id);

            return {
                id: device.id,
                name: device.name,
                uniqueId: device.uniqueId,
                status: device.status as Vehicle['status'],
                category: device.category,
                latitude: pos?.latitude ?? 0,
                longitude: pos?.longitude ?? 0,
                speed: pos ? knotsToKmh(pos.speed) : 0,
                course: pos?.course ?? 0,
                address: pos?.address ?? null,
                lastUpdate: device.lastUpdate,
                fixTime: pos?.fixTime ?? null,
                attributes: { ...device.attributes, ...pos?.attributes },
            };
        });

        return NextResponse.json({ vehicles });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Vehicles API Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
