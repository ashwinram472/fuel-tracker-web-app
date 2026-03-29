'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { divIcon, LatLngBounds } from 'leaflet';

// Fix typical Leaflet default icon issues if not loaded globally
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

// Component to dynamically set map bounds based on route points
function BoundsFitter({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = new LatLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [points, map]);
  
  return null;
}

// Custom vehicle marker moving along route
function VehicleMarker({ position, course }: { position: [number, number], course: number }) {
  // Use divIcon to style exactly like the flutter app (white circle, icon inside)
  const iconHtml = `
    <div style="background: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); transform: rotate(${course}deg);">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--info)" stroke="none" transform="rotate(-45)">
         <path d="M3 21 21 3M21 3 21 14M21 3 10 3" stroke="var(--info)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
         <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" fill="var(--info)" stroke="white" stroke-width="2"/>
      </svg>
    </div>
  `;
  
  const icon = divIcon({
    html: iconHtml,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  return <Marker position={position} icon={icon} zIndexOffset={100} />;
}

export default function PlaybackMap({ routePoints, vehicleId, distance }: { routePoints: any[], vehicleId: string, distance: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Extract lat/lng pairs efficiently
  const coordinates: [number, number][] = useMemo(() => 
    routePoints.map(p => [p.latitude, p.longitude]), 
  [routePoints]);

  const togglePlayback = () => {
    if (routePoints.length === 0) return;
    
    setIsPlaying(prev => {
      if (!prev) {
        if (currentIndex >= routePoints.length - 1) {
          setCurrentIndex(0);
        }
        return true;
      }
      return false;
    });
  };

  useEffect(() => {
    if (isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      
      const interval = Math.max(50, 1000 / speedMultiplier);
      
      timerRef.current = setInterval(() => {
        setCurrentIndex(curr => {
          if (curr < routePoints.length - 1) {
            return curr + 1;
          } else {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return curr;
          }
        });
      }, interval);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speedMultiplier, routePoints.length]);

  const updateSpeed = () => {
    setSpeedMultiplier(curr => {
      if (curr === 1) return 2;
      if (curr === 2) return 4;
      if (curr === 4) return 8;
      return 1;
    });
  };

  if (routePoints.length === 0) {
    return (
      <div className="absolute inset-x-8 bottom-32 bg-[var(--surface-container)] p-6 rounded-xl shadow-lg border border-[var(--outline)] text-center text-[var(--text-secondary)] z-[1000] font-semibold">
        No detailed route coordinates found for this trip.
      </div>
    );
  }

  const currentPoint = routePoints[currentIndex];

  const formatTime = (iso: string) => {
    if (!iso) return '--:--';
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={coordinates[0]}
        zoom={14}
        className="h-full w-full z-0"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <BoundsFitter points={coordinates} />

        {/* Full Route Trajectory (primary color) */}
        <Polyline
          positions={coordinates}
          color="var(--primary)"
          weight={4}
          opacity={0.5}
        />
        
        {/* Past Trajectory (success color) */}
        {currentIndex > 0 && (
          <Polyline
             positions={coordinates.slice(0, currentIndex + 1)}
             color="var(--success)"
             weight={5}
             opacity={1}
          />
        )}

        {/* Start / End Markers */}
        <Marker 
          position={coordinates[0]} 
          icon={divIcon({
             html: `<div style="width:16px;height:16px;background:var(--success);border-radius:50%;border:3px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>`,
             className: '',
             iconSize: [16,16],
             iconAnchor: [8,8]
          })} 
        />
        
        <Marker 
          position={coordinates[coordinates.length - 1]} 
          icon={divIcon({
             html: `<div style="width:16px;height:16px;background:var(--error);border-radius:50%;border:3px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>`,
             className: '',
             iconSize: [16,16],
             iconAnchor: [8,8]
          })} 
        />

        {/* Moving Vehicle */}
        {currentPoint && (
          <VehicleMarker 
             position={[currentPoint.latitude, currentPoint.longitude]} 
             course={currentPoint.course || 0} 
          />
        )}
      </MapContainer>

      {/* Control Panel (Matching Playback History Screen in Flutter app) */}
      <div className="absolute left-4 right-4 bottom-8 z-[1000] drop-shadow-2xl">
        <div className="bg-[var(--surface)] bg-opacity-95 backdrop-blur-xl p-5 rounded-2xl border border-[var(--outline)] max-w-lg mx-auto w-full">
           
           {/* Top Stats */}
           <div className="flex justify-between items-center mb-5">
              <div className="text-[var(--text-secondary)] font-bold text-sm bg-[var(--surface-container)] px-3 py-1.5 rounded-lg border border-[var(--outline)]">
                {formatTime(currentPoint?.fixTime)}
              </div>
              <div className="flex items-baseline gap-1">
                 <span className="text-2xl font-black tracking-tight text-[var(--info)]">
                    {Math.round(currentPoint?.speed ? currentPoint.speed * 1.852 : 0)}
                 </span>
                 <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">km/h</span>
              </div>
           </div>

           {/* Progress Bar (Slider) */}
           <div className="mb-4 group relative">
              <input
                type="range"
                min="0"
                max={Math.max(routePoints.length - 1, 1)}
                value={currentIndex}
                onChange={(e) => {
                  setCurrentIndex(parseInt(e.target.value));
                  setIsPlaying(false);
                }}
                className="w-full h-2 bg-[var(--outline)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                style={{
                   background: `linear-gradient(to right, var(--primary) ${(currentIndex / (Math.max(routePoints.length - 1, 1))) * 100}%, var(--outline) ${(currentIndex / (Math.max(routePoints.length - 1, 1))) * 100}%)`
                }}
              />
           </div>

           {/* Playback Controls */}
           <div className="flex items-center justify-center relative mt-2">
             <button 
                onClick={updateSpeed}
                className="absolute left-0 w-12 h-10 bg-[var(--surface-container)] rounded-lg font-bold text-[var(--text-primary)] hover:bg-[var(--outline)] transition text-sm flex items-center justify-center border border-[var(--card-border)]">
                {speedMultiplier}x
             </button>

             <button 
                onClick={togglePlayback}
                className="w-16 h-16 bg-[var(--primary)] text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-[var(--primary)]/30">
                {isPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                     <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                     <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                  </svg>
                ) : (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="ml-2">
                     <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                )}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
