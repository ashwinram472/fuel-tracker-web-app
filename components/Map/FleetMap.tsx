"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import L from "leaflet";
import { Vehicle } from "@/lib/types";
import { useEffect, useRef } from "react";

interface FleetMapProps {
  vehicles: Vehicle[];
  selectedVehicleId?: string | null;
  onVehicleSelect: (id: string) => void;
}

// Custom Truck Icon
const createTruckIcon = (heading: number, status: string) => {
  const color = status === 'moving' ? '#3b82f6' : status === 'idle' ? '#f59e0b' : '#ef4444';

  // Simple SVG Truck rotated by heading
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" style="transform: rotate(${heading}deg); width: 32px; height: 32px;">
      <path d="M1 3h14v15H1z" /> <!-- trailer -->
      <path d="M15 11h4l2 3v4h-6z" /> <!-- cab -->
      <circle cx="5" cy="19" r="2" fill="#333" />
      <circle cx="11" cy="19" r="2" fill="#333" />
      <circle cx="19" cy="19" r="2" fill="#333" />
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'bg-transparent',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};


export default function FleetMap({ vehicles, selectedVehicleId, onVehicleSelect }: FleetMapProps) {
  const mapRef = useRef<L.Map>(null);

  // Focus on selected vehicle
  useEffect(() => {
    if (selectedVehicleId && mapRef.current) {
      const v = vehicles.find(v => v.id === selectedVehicleId);
      if (v) {
        mapRef.current.flyTo([v.location.lat, v.location.lng], 14, { animate: true });
      }
    }
  }, [selectedVehicleId, vehicles]);

  return (
    <MapContainer
      center={[19.0760, 72.8777]} // Mumbai
      zoom={9}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
      ref={mapRef}
      className="bg-slate-900"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

      {vehicles.map((v) => (
        <Marker
          key={v.id}
          position={[v.location.lat, v.location.lng]}
          icon={createTruckIcon(v.heading, v.status)}
          eventHandlers={{
            click: () => onVehicleSelect(v.id),
          }}
        >
          <Popup className="custom-popup">
            <div className="font-sans text-sm">
              <div className="font-bold text-base mb-1">{v.name}</div>
              <div className="text-gray-400 text-xs mb-2">ID: {v.id}</div>
              <div className="flex justify-between gap-4">
                <span>Speed: {v.speed.toFixed(0)} km/h</span>
                <span>Fuel: {v.fuelLevel.toFixed(0)}L</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
