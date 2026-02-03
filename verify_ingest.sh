#!/bin/bash
echo "Sending data to /api/ingest..."
curl -v -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"vehicleId": "TRUCK-100", "lat": 18.9, "lng": 73.1, "speed": 55, "fuelLevel": 88, "timestamp": "2024-01-31T12:00:00Z"}'

echo "\nCheck dashboard for status."
