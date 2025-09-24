import React from 'react';

export const StatBar = ({ value, maxValue, colorClass, label }) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-300">{label}</span>
        <span className="text-xs font-semibold text-white">{value} / {maxValue}</span>
      </div>
      <div className="w-full bg-gray-700/50 rounded-full h-2.5">
        <div 
          className={`${colorClass} h-2.5 rounded-full transition-all duration-500`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export const XPBar = ({ value, maxValue, onUpdate, isGm }) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-yellow-300">XP</span>
        {isGm ? (
          <div className="flex items-center space-x-1">
             <input 
                type="number"
                value={value}
                onChange={onUpdate}
                className="w-16 bg-gray-900/50 border border-yellow-700/30 rounded px-1 py-0 text-yellow-100 text-center text-xs"
             />
             <span className="text-xs font-semibold text-white">/ {maxValue}</span>
          </div>
        ) : (
          <span className="text-xs font-semibold text-white">{value} / {maxValue}</span>
        )}
      </div>
      <div className="w-full bg-gray-700/50 rounded-full h-2.5">
        <div 
          className="bg-yellow-500 h-2.5 rounded-full transition-all duration-500" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};
