import net from 'net';

// Helper to convert a hex string to a Buffer
const hexToBuffer = (hex: string) => Buffer.from(hex, 'hex');

// Sample GT06 Login Packet (Header: 78 78, Protocol: 01)
// Contains a dummy IMEI
const mockLoginPacket = "78781101086552504104256280010001000600021A470D0A";

// Sample GT06 Location Packet (Header: 78 78, Protocol: 22)
// This translates to roughly Bangalore. We will modify the lat/lng slightly in a loop to simulate movement.
let currentLatRaw = 23348880; // ~12.9716 * 1800000
let currentLngRaw = 139670280; // ~77.5946 * 1800000

function generateLocationPacket() {
    // Move slightly southeast
    currentLatRaw -= 500;
    currentLngRaw += 500;

    const latHex = currentLatRaw.toString(16).padStart(8, '0');
    const lngHex = currentLngRaw.toString(16).padStart(8, '0');

    // Example layout: 78 78 [length] 22 [Datetime 6 bytes] [GPS length 1] [Lat 4 bytes] [Lng 4 bytes] [Speed 1] [Course 2] ...
    // This is a simplified mock payload specifically matching our parser's byte offsets.
    // Length: 22 bytes = 16 hex. 
    const mockPayload = `787820220A0B1A0F2B0012${latHex}${lngHex}3C0000000000000000000000000D0A`;
    return mockPayload;
}

const client = new net.Socket();

client.connect(5000, '127.0.0.1', () => {
    console.log('Connected to Tracker Bridge on port 5000');

    console.log('Sending Login Packet...');
    client.write(hexToBuffer(mockLoginPacket));

    // Send a location update every 3 seconds to simulate movement
    setInterval(() => {
        const locPacket = generateLocationPacket();
        console.log('Sending Location Update...', locPacket);
        client.write(hexToBuffer(locPacket));
    }, 3000);
});

client.on('data', (data) => {
    console.log('Received response from server:', data.toString('hex').toUpperCase());
});

client.on('close', () => {
    console.log('Connection closed');
});

client.on('error', (err) => {
    console.error('Connection error:', err.message);
});
