import net from 'net';
import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Firebase Admin (assuming credentials in ENV or default)
// For local testing, ensure GOOGLE_APPLICATION_CREDENTIALS is set, or use env vars
if (!admin.apps.length) {
    let credential;
    // Attempt to use a service account key if provided, otherwise default fallback
    try {
        const serviceAccount = require('./serviceAccountKey.json');
        credential = admin.credential.cert(serviceAccount);
    } catch (e) {
        console.warn("No serviceAccountKey.json found, falling back to application default credentials.");
        credential = admin.credential.applicationDefault(); // requires GOOGLE_APPLICATION_CREDENTIALS
    }

    admin.initializeApp({
        credential,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
}

const db = admin.firestore();

// Helper to parse hex string to int
const hexToInt = (hex: string): number => parseInt(hex, 16);

// GT06 Parser Logic
function parseGT06(data: Buffer) {
    const hex = data.toString('hex').toUpperCase();

    // Check header
    if (!hex.startsWith('7878') && !hex.startsWith('7979')) return null;

    const packetLength = hexToInt(hex.substring(4, 6));
    const protocolNumber = hex.substring(6, 8);

    let parsedData: any = { protocolNumber };

    // Login Message (0x01)
    if (protocolNumber === '01') {
        const imei = hex.substring(8, 24);
        parsedData.type = 'LOGIN';
        parsedData.imei = imei;
        // Build response: 78 78 05 01 [serial number] [error check] 0D 0A
        const serialNumber = hex.substring(hex.length - 12, hex.length - 8);
        parsedData.response = buildResponse('01', serialNumber);
        console.log(`[LOGIN] IMEI: ${imei}`);
    }
    // Location Data Message (0x22 or 0x12)
    else if (protocolNumber === '22' || protocolNumber === '12') {
        parsedData.type = 'LOCATION';

        // Very simplified GT06 parsing for lat/lng
        // Example structure for 0x22 length >= 36:
        // DateTime (6 bytes): 8-20
        // Quantity of GPS info (1): 20-22
        // Lat (4): 22-30
        // Lng (4): 30-38
        // Speed (1): 38-40
        // Course/Status (2): 40-44

        try {
            const latRaw = hexToInt(hex.substring(22, 30));
            const lngRaw = hexToInt(hex.substring(30, 38));
            const speedRaw = hexToInt(hex.substring(38, 40));

            // Decimal degrees = raw / (30000 * 60) for older GT06, or raw / 1800000
            const lat = latRaw / 1800000;
            const lng = lngRaw / 1800000;

            const courseStatusRaw = hexToInt(hex.substring(40, 44));

            // ACC/Ignition is usually in terminal information (0x13) or combined in some packets.
            // For a basic Vento 2017 setup, we'll try to extract ACC or default to true if moving.
            // Status byte decoding varying by specific device.
            const ignition = speedRaw > 0; // Fallback logic

            parsedData.lat = lat;
            parsedData.lng = lng;
            parsedData.speed = speedRaw;
            parsedData.ignition = ignition;

            console.log(`[LOCATION] Lat: ${lat}, Lng: ${lng}, Speed: ${speedRaw}, Ignition: ${ignition}`);
        } catch (err) {
            console.error("Error parsing location packet", err);
        }
    }

    return parsedData;
}

function buildResponse(protocol: string, serial: string): Buffer {
    // A proper implementation needs CRC-ITU calculation.
    // For now we send a simple generic ACK
    const ackHex = `787805${protocol}${serial}00000D0A`; // Placeholder CRC
    return Buffer.from(ackHex, 'hex');
}

const PORT = 5000;
const server = net.createServer((socket) => {
    console.log('Client connected:', socket.remoteAddress);

    // We treat this connection as linked to a specific vehicle/IMEI once logged in
    let vehicleId = 'Vento'; // default mapping for the request

    socket.on('data', async (data) => {
        const parsed = parseGT06(data);
        if (!parsed) return;

        if (parsed.type === 'LOGIN' && parsed.response) {
            socket.write(parsed.response);
        }

        if (parsed.type === 'LOCATION' && parsed.lat && parsed.lng) {
            try {
                // Save to Firestore 'vehicle_logs' using server timestamp
                await db.collection('vehicle_logs').add({
                    vehicleId: vehicleId,
                    location: { lat: parsed.lat, lng: parsed.lng },
                    speed: parsed.speed,
                    ignition: parsed.ignition,
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });

                // Also update the latest state to be read by the frontend listener efficiently.
                // We'll write to a "latest" document per vehicle.
                await db.collection('vehicle_logs').doc(`latest_${vehicleId}`).set({
                    vehicleId: vehicleId,
                    location: { lat: parsed.lat, lng: parsed.lng },
                    speed: parsed.speed,
                    ignition: parsed.ignition,
                    lastSeenAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                console.log(`Firestore updated for ${vehicleId} at ${parsed.lat}, ${parsed.lng}`);
            } catch (err) {
                console.error("Firestore Error:", err);
            }
        }
    });

    socket.on('end', () => {
        console.log('Client disconnected');
    });

    socket.on('error', (err) => {
        console.error('Socket error:', err);
    });
});

server.listen(PORT, () => {
    console.log(`GT06 Tracker Bridge listening on port ${PORT}`);
});
