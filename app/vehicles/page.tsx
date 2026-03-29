"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Vehicle } from "@/lib/types";
import { logoutAction } from "@/app/actions/auth";
import { useTraccarSocket } from "@/components/useWebSocket";

const FleetMap = dynamic(() => import("@/components/Map/FleetMap"), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-[var(--surface-container)] flex items-center justify-center text-[var(--text-secondary)]">
            Loading Map...
        </div>
    ),
});

export default function VehiclesPage() {
    const router = useRouter();
    const { vehicles, loading } = useTraccarSocket();
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const selectedVehicle = useMemo(() =>
        vehicles.find(v => v.id === selectedId),
        [vehicles, selectedId]
    );

    const movingCount = vehicles.filter(v => v.status === 'online' && v.speed > 0).length;
    const idleCount = vehicles.filter(v => v.status === 'online' && v.speed === 0).length;
    const offlineCount = vehicles.filter(v => v.status === 'offline' || v.status === 'unknown').length;

    const formatTimeAgo = (dateStr: string | null) => {
        if (!dateStr) return 'Never';
        const diff = Date.now() - new Date(dateStr).getTime();
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    };

    return (
        <main className="flex flex-col h-screen w-screen bg-[var(--background)] overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-3 bg-[var(--surface)] border-b" style={{ borderColor: 'var(--card-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[var(--surface-container)] flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                    <span className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                        Flytr
                    </span>
                </div>

                {/* Status pills and Logout */}
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/history')}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-[var(--primary)] text-white hover:bg-[var(--primary-container)] transition-colors shadow-sm mr-2"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                        Trip History
                    </button>

                    <div className="flex items-center gap-4 text-xs font-semibold hidden md:flex">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(56, 104, 74, 0.1)' }}>
                            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--status-moving)' }}></span>
                            <span style={{ color: 'var(--status-moving)' }}>{movingCount} Moving</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(165, 99, 30, 0.1)' }}>
                            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--status-idle)' }}></span>
                            <span style={{ color: 'var(--status-idle)' }}>{idleCount} Idle</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(86, 94, 119, 0.1)' }}>
                            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--status-offline)' }}></span>
                            <span style={{ color: 'var(--status-offline)' }}>{offlineCount} Offline</span>
                        </div>
                    </div>

                    <div className="w-[1px] h-6 bg-[var(--outline)] mx-1" />

                    <button 
                        onClick={async () => {
                            await logoutAction();
                            router.push('/login');
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--surface-container)] text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--error)] hover:bg-opacity-10 border border-[var(--outline)] transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            Sign Out
                    </button>
                </div>
            </div>

            {/* Map area */}
            <div className="flex-1 relative">
                <FleetMap
                    vehicles={vehicles}
                    selectedVehicleId={selectedId}
                    onVehicleSelect={setSelectedId}
                />

                {/* Bottom vehicle cards — horizontal scroll */}
                {vehicles.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 pointer-events-none"
                         style={{ background: 'linear-gradient(transparent, rgba(238,238,233,0.9) 40%, var(--surface-container))' }}>
                        <div className="pointer-events-auto overflow-x-auto flex gap-3 px-4 pt-10 pb-4"
                             style={{ scrollbarWidth: 'none' }}>
                            {vehicles.map((v) => {
                                const isSelected = v.id === selectedId;
                                const isOnline = v.status === 'online';
                                const isMoving = isOnline && v.speed > 0;

                                const statusColor = isMoving ? 'var(--status-moving)'
                                    : isOnline ? 'var(--status-idle)'
                                    : 'var(--status-offline)';
                                const statusLabel = isMoving ? 'MOVING' : isOnline ? 'IDLE' : 'OFFLINE';
                                const statusBg = isMoving ? 'rgba(56,104,74,0.15)'
                                    : isOnline ? 'rgba(165,99,30,0.15)'
                                    : 'rgba(86,94,119,0.15)';

                                return (
                                    <div
                                        key={v.id}
                                        onClick={() => setSelectedId(isSelected ? null : v.id)}
                                        className="shrink-0 cursor-pointer transition-all duration-200"
                                        style={{
                                            width: '220px',
                                            padding: '16px',
                                            background: isSelected ? 'rgba(97,0,0,0.08)' : 'var(--surface)',
                                            borderRadius: '16px',
                                            border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--card-border)',
                                            boxShadow: isSelected ? 'none' : '0 12px 32px rgba(26,28,25,0.06)',
                                        }}
                                    >
                                        {/* Name + Status */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                                                <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                                    {v.name}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide shrink-0"
                                                  style={{ color: statusColor, background: statusBg, letterSpacing: '0.5px' }}>
                                                {statusLabel}
                                            </span>
                                        </div>

                                        {/* Speed + Last update */}
                                        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                                            <div className="flex items-center gap-1">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 12m-9 0a9 9 0 1 0 18 0 9 9 0 1 0-18 0"/><path d="M12 7v5l3 3"/></svg>
                                                <span>{v.speed.toFixed(0)} km/h</span>
                                            </div>
                                            <span className="text-[11px]">{formatTimeAgo(v.lastUpdate)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Selected vehicle detail card */}
                {selectedVehicle && (
                    <div className="absolute top-4 right-4 z-[1000] animate-in" style={{ maxWidth: '360px', width: '100%' }}>
                        <div className="ambient-shadow"
                             style={{
                                 background: 'var(--surface)',
                                 borderRadius: '20px',
                                 overflow: 'hidden',
                             }}>
                            {/* Header */}
                            <div className="px-5 pt-4 pb-3 flex items-start justify-between">
                                <div>
                                    <h2 className="text-lg font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                                        {selectedVehicle.name}
                                    </h2>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                        ID: {selectedVehicle.uniqueId}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedId(null)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--surface-container)] transition-colors"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Status badge */}
                            <div className="px-5 pb-3">
                                {(() => {
                                    const isOnline = selectedVehicle.status === 'online';
                                    const isMoving = isOnline && selectedVehicle.speed > 0;
                                    const statusColor = isMoving ? 'var(--status-moving)'
                                        : isOnline ? 'var(--status-idle)'
                                        : 'var(--status-offline)';
                                    const statusLabel = isMoving ? 'MOVING' : isOnline ? 'IDLE' : 'OFFLINE';
                                    const statusBg = isMoving ? 'rgba(56,104,74,0.15)'
                                        : isOnline ? 'rgba(165,99,30,0.15)'
                                        : 'rgba(86,94,119,0.15)';

                                    return (
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded tracking-wide"
                                              style={{ color: statusColor, background: statusBg, letterSpacing: '0.5px' }}>
                                            <span className="w-2 h-2 rounded-full" style={{ background: statusColor }}></span>
                                            {statusLabel}
                                        </span>
                                    );
                                })()}
                            </div>

                            {/* Metrics grid */}
                            <div className="grid grid-cols-2 gap-3 px-5 pb-4">
                                <div className="p-3 rounded-xl" style={{ background: 'var(--surface-container)' }}>
                                    <div className="text-[11px] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                                        Speed
                                    </div>
                                    <div className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)', fontFamily: 'monospace', letterSpacing: '-1px' }}>
                                        {selectedVehicle.speed.toFixed(0)}
                                        <span className="text-sm font-medium ml-1" style={{ color: 'var(--text-secondary)' }}>km/h</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl" style={{ background: 'var(--surface-container)' }}>
                                    <div className="text-[11px] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                                        Heading
                                    </div>
                                    <div className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)', fontFamily: 'monospace', letterSpacing: '-1px' }}>
                                        {selectedVehicle.course.toFixed(0)}
                                        <span className="text-sm font-medium ml-1" style={{ color: 'var(--text-secondary)' }}>°</span>
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            {selectedVehicle.address && (
                                <div className="px-5 pb-4">
                                    <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'var(--surface-container)' }}>
                                        <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                            <circle cx="12" cy="10" r="3"/>
                                        </svg>
                                        <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                            {selectedVehicle.address}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Info rows */}
                            <div className="px-5 pb-5 space-y-2">
                                <div className="flex justify-between text-xs py-1.5">
                                    <span style={{ color: 'var(--text-secondary)' }}>Coordinates</span>
                                    <span className="font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                                        {selectedVehicle.latitude.toFixed(5)}, {selectedVehicle.longitude.toFixed(5)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs py-1.5" style={{ borderTop: '1px solid var(--card-border)' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Last Update</span>
                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                        {formatTimeAgo(selectedVehicle.lastUpdate)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs py-1.5" style={{ borderTop: '1px solid var(--card-border)' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Fix Time</span>
                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                        {selectedVehicle.fixTime
                                            ? new Date(selectedVehicle.fixTime).toLocaleString()
                                            : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading overlay */}
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center z-[1000]"
                         style={{ background: 'rgba(250,250,245,0.8)', backdropFilter: 'blur(4px)' }}>
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-3 border-[var(--surface-container)] rounded-full animate-spin"
                                 style={{ borderTopColor: 'var(--primary)' }}></div>
                            <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                Loading fleet data...
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
