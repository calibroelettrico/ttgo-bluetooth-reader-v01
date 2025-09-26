
import React from 'react';

interface MeasurementDisplayProps {
  measurement: number | null;
}

const MAX_DISPLAY_CM = 200; // Max value for visualization, e.g., 200 cm

const MeasurementDisplay: React.FC<MeasurementDisplayProps> = ({ measurement }) => {
  const displayValue = measurement ?? 0;
  const percentage = Math.min((displayValue / MAX_DISPLAY_CM) * 100, 100);

  return (
    <div className="relative w-80 h-80 flex items-center justify-center">
      <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          strokeWidth="12"
          className="stroke-slate-700"
        />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          strokeWidth="12"
          className="stroke-cyan-500 transition-all duration-500 ease-out"
          strokeDasharray={Math.PI * 108}
          strokeDashoffset={Math.PI * 108 * (1 - percentage / 100)}
          strokeLinecap="round"
        />
      </svg>
      <div className="z-10 text-center">
        {measurement !== null ? (
          <>
            <span className="text-8xl font-bold text-white tracking-tighter">
              {measurement}
            </span>
            <span className="text-3xl font-light text-slate-400 ml-2">cm</span>
          </>
        ) : (
          <span className="text-4xl font-light text-slate-500">--</span>
        )}
      </div>
    </div>
  );
};

export default MeasurementDisplay;
