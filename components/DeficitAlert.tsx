import React from 'react';
import { NutrientDeficit } from '../utils/deficitCalculator';

interface DeficitAlertProps {
  deficits: NutrientDeficit[];
  onViewDetails?: () => void;
}

export const DeficitAlert: React.FC<DeficitAlertProps> = ({ deficits, onViewDetails }) => {
  if (deficits.length === 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <h3 className="font-bold text-green-400 text-sm">All Targets Met!</h3>
            <p className="text-xs text-green-300 mt-1">
              You're meeting all your nutrition goals today. Great work!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const criticalCount = deficits.filter(d => d.severity === 'critical').length;
  const highCount = deficits.filter(d => d.severity === 'high').length;
  
  const topDeficit = deficits[0];
  
  const severityColor = {
    critical: 'red',
    high: 'orange',
    medium: 'yellow',
    low: 'blue'
  }[topDeficit.severity];

  return (
    <div className={`bg-${severityColor}-500/10 border border-${severityColor}-500/30 rounded-lg p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-2xl">
            {topDeficit.severity === 'critical' ? '🚨' : 
             topDeficit.severity === 'high' ? '⚠️' : 
             topDeficit.severity === 'medium' ? '⚡' : 'ℹ️'}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-bold text-${severityColor}-400 text-sm`}>
                Nutrient Gap{deficits.length > 1 ? 's' : ''} Detected
              </h3>
              {(criticalCount > 0 || highCount > 0) && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold bg-${severityColor}-500/20 text-${severityColor}-300`}>
                  {criticalCount > 0 ? `${criticalCount} Critical` : `${highCount} High`}
                </span>
              )}
            </div>
            
            <div className="space-y-2 mt-2">
              {deficits.slice(0, 3).map((deficit, idx) => (
                <DeficitItem key={deficit.nutrient_key} deficit={deficit} rank={idx + 1} />
              ))}
            </div>
            
            {deficits.length > 3 && (
              <button
                onClick={onViewDetails}
                className="text-xs text-amber-400 hover:text-amber-300 mt-2 font-medium"
              >
                View all {deficits.length} gaps →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DeficitItem: React.FC<{ deficit: NutrientDeficit; rank: number }> = ({ deficit, rank }) => {
  const { display_name, current, target, percentage_met, unit, food_sources } = deficit;
  
  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">#{rank}</span>
          <span className="font-semibold text-white text-sm">{display_name}</span>
        </div>
        <span className="text-xs text-slate-400">
          {current.toFixed(1)}/{target.toFixed(1)} {unit}
        </span>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 bg-slate-700 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${
              percentage_met < 25 ? 'bg-red-500' :
              percentage_met < 50 ? 'bg-orange-500' :
              percentage_met < 80 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentage_met, 100)}%` }}
          />
        </div>
        <span className="text-xs font-bold text-white">{percentage_met}%</span>
      </div>
      
      <div className="text-xs text-slate-400">
        <span className="font-medium">Good sources:</span>{' '}
        {food_sources.slice(0, 3).join(', ')}
      </div>
    </div>
  );
};
