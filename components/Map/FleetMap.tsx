"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet-defaulticon-compatibility";
import { Vehicle } from "@/lib/types";
import { useEffect, useRef } from "react";

interface FleetMapProps {
  vehicles: Vehicle[];
  selectedVehicleId?: number | null;
  onVehicleSelect: (id: number | null) => void;
}

// Circular marker matching Flutter app's design
const createVehicleIcon = (status: string, speed: number, isSelected: boolean) => {
  const isOnline = status === 'online';
  const isMoving = isOnline && speed > 0;

  const color = isMoving ? '#38684A' : isOnline ? '#A5631E' : '#565E77';
  const outerSize = isSelected ? 40 : 24;
  const innerSize = isSelected ? 18 : 14;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${outerSize}" height="${outerSize}" viewBox="0 0 ${outerSize} ${outerSize}">
      <circle cx="${outerSize / 2}" cy="${outerSize / 2}" r="${outerSize / 2}" fill="${color}" opacity="0.3"/>
      <circle cx="${outerSize / 2}" cy="${outerSize / 2}" r="${innerSize / 2}" fill="${color}" stroke="white" stroke-width="2"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'bg-transparent border-0',
    iconSize: [outerSize, outerSize],
    iconAnchor: [outerSize / 2, outerSize / 2],
  });
};


export default function FleetMap({ vehicles, selectedVehicleId, onVehicleSelect }: FleetMapProps) {
  const mapRef = useRef<L.Map>(null);

  // Focus on selected vehicle
  useEffect(() => {
    if (selectedVehicleId && mapRef.current) {
      const v = vehicles.find(v => v.id === selectedVehicleId);
      if (v && v.latitude !== 0 && v.longitude !== 0) {
        mapRef.current.flyTo([v.latitude, v.longitude], 14, { animate: true, duration: 0.8 });
      }
    }
  }, [selectedVehicleId, vehicles]);

  // Default center: first vehicle or India center
  const center = vehicles.length > 0 && vehicles[0].latitude !== 0
    ? [vehicles[0].latitude, vehicles[0].longitude] as [number, number]
    : [11.5, 77.5] as [number, number]; // Tamil Nadu approximate center

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={10}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        ref={mapRef}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {vehicles.map((v) => (
          v.latitude !== 0 && v.longitude !== 0 && (
            <Marker
              key={v.id}
              position={[v.latitude, v.longitude]}
              icon={createVehicleIcon(v.status, v.speed, v.id === selectedVehicleId)}
              eventHandlers={{
                click: () => onVehicleSelect(v.id),
              }}
            >
              <Popup className="custom-popup">
                <div style={{ fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: '#1A1C19' }}>
                    {v.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#565E77', marginBottom: '8px' }}>
                    {v.uniqueId}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '12px', color: '#1A1C19' }}>
                    <span>🏎 {v.speed.toFixed(0)} km/h</span>
                    <span>🧭 {v.course.toFixed(0)}°</span>
                  </div>
                  {v.address && (
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#565E77', lineHeight: '1.4' }}>
                      📍 {v.address}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}
