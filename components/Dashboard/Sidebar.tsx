import { Vehicle } from "@/lib/types";
import { Card } from "../ui/Card";

interface SidebarProps {
  vehicles: Vehicle[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
}

export function Sidebar({ vehicles, selectedId, onSelect }: SidebarProps) {
  // Simple search filter could go here

  return (
    <div className="h-full flex flex-col bg-[var(--card-bg)] border-r border-[var(--card-border)] w-80 shrink-0">
      <div className="p-4 border-b border-[var(--card-border)]">
        <h1 className="text-xl font-bold text-white tracking-tight">FleetCommand</h1>
        <p className="text-xs text-gray-400 mt-1">Real-time Operations</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {vehicles.map((v) => (
          <div
            key={v.id}
            onClick={() => onSelect(v.id)}
            className={`
              p-3 rounded-lg cursor-pointer transition-all border
              ${selectedId === v.id
                ? 'bg-blue-900/20 border-blue-500/50'
                : 'bg-transparent border-transparent hover:bg-white/5'}
            `}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-sm text-gray-100">{v.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider
                ${v.status === 'moving' ? 'bg-green-500/20 text-green-400' :
                  v.status === 'idle' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}
              `}>
                {v.status}
              </span>
            </div>

            <div className="flex justify-between text-xs text-gray-400">
              <span>{v.speed.toFixed(0)} km/h</span>
              <div className="flex items-center gap-2">
                {v.alerts?.fuelTheft && (
                   <span className="text-red-500 font-bold animate-pulse">⚠ THEFT</span>
                )}
                <span>{v.fuelLevel.toFixed(0)}L</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-[var(--card-border)] text-xs text-center text-gray-500">
        {vehicles.length} Vehicles Online
      </div>
    </div>
  );
}
