import { Vehicle } from "@/lib/types";
import { Card } from "../ui/Card";

interface VehicleDetailsProps {
  vehicle: Vehicle;
  onClose: () => void;
}

export function VehicleDetails({ vehicle, onClose }: VehicleDetailsProps) {
  const isTheft = vehicle.alerts?.fuelTheft;
  const fuelPct = (vehicle.fuelLevel / vehicle.fuelCapacity) * 100;

  return (
    <Card className="absolute top-4 right-4 w-96 max-h-[calc(100vh-2rem)] overflow-y-auto p-0 z-[1000] backdrop-blur-md bg-opacity-90">
      <div className="p-4 border-b border-[var(--card-border)] flex justify-between items-center sticky top-0 bg-[var(--card-bg)] z-10">
        <div>
          <h2 className="text-lg font-bold">{vehicle.name}</h2>
          <p className="text-xs text-gray-400">{vehicle.type.toUpperCase()} • {vehicle.id}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>

      <div className="p-4 space-y-6">

        {/* ALERTS */}
        {isTheft && (
          <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg flex items-center gap-3 animate-pulse">
            <div className="text-2xl">🚨</div>
            <div>
              <div className="text-red-400 font-bold text-sm">FUEL THEFT DETECTED</div>
              <div className="text-red-300/70 text-xs">Sudden fuel drop detected.</div>
            </div>
          </div>
        )}

        {/* METRICS GRID */}
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 p-3 rounded-lg">
                <div className="text-gray-400 text-xs mb-1">Speed</div>
                <div className="text-2xl font-mono font-bold">{vehicle.speed.toFixed(0)} <span className="text-sm text-gray-500">km/h</span></div>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
                <div className="text-gray-400 text-xs mb-1">Odometer</div>
                <div className="text-xl font-mono font-bold">{vehicle.odometer.toFixed(0)} <span className="text-sm text-gray-500">km</span></div>
            </div>
        </div>

        {/* FUEL TRACKING */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <h3 className="text-sm font-semibold text-gray-300">Fuel Level</h3>
            <span className={`text-xs font-mono ${isTheft ? 'text-red-400' : 'text-blue-400'}`}>
              {vehicle.fuelLevel.toFixed(1)} / {vehicle.fuelCapacity} L
            </span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden relative">
             <div
               className={`h-full transition-all duration-500 ${isTheft ? 'bg-red-500' : 'bg-blue-500'}`}
               style={{ width: `${fuelPct}%` }}
             />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-gray-500">
             <span>Prediction: {((vehicle.fuelLevel / vehicle.fuelConsumptionRate)).toFixed(0)} km range</span>
          </div>
        </div>

        {/* DRIVER SAFETY SCORE */}
        <div className="bg-white/5 p-4 rounded-xl flex items-center justify-between">
           <div>
              <h3 className="text-sm font-semibold text-gray-200">Safety Score</h3>
              <p className="text-xs text-gray-500 mt-1">Based on braking & speed</p>
           </div>
           <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-700" />
                <circle
                  cx="32" cy="32" r="28"
                  stroke="currentColor" strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={175}
                  strokeDashoffset={175 - (175 * vehicle.safetyScore) / 100}
                  className={`${vehicle.safetyScore > 80 ? 'text-green-500' : vehicle.safetyScore > 50 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000`}
                />
              </svg>
              <span className="absolute text-sm font-bold">{vehicle.safetyScore.toFixed(0)}</span>
           </div>
        </div>

        {/* PREDICTIVE MAINTENANCE */}
        <div className="flex items-center justify-between p-3 border border-[var(--card-border)] rounded-lg">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${vehicle.maintenanceStatus === 'good' ? 'bg-green-500' : vehicle.maintenanceStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">Engine Health</span>
            </div>
            <span className="text-xs uppercase tracking-wider text-gray-400">{vehicle.maintenanceStatus}</span>
        </div>

        {/* CO2 & ZONE */}
        <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/5 p-2 rounded flex flex-col items-center justify-center gap-1">
                <span className="text-gray-400">CO2 Emitted</span>
                <span className="font-bold text-gray-200">{vehicle.co2Emissions.toFixed(1)} kg</span>
            </div>
             <div className="bg-white/5 p-2 rounded flex flex-col items-center justify-center gap-1">
                <span className="text-gray-400">Current Zone</span>
                <span className="font-bold text-blue-300">{vehicle.zone}</span>
            </div>
        </div>

      </div>
    </Card>
  );
}
