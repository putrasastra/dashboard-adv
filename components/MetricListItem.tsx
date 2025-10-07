import React from 'react';

interface MetricListItemProps {
  title: React.ReactNode;
  value: React.ReactNode;
  icon: React.ReactNode;
  description: React.ReactNode;
  colorClass: string;
}

const MetricListItem: React.FC<MetricListItemProps> = ({ title, value, icon, description, colorClass }) => {
  return (
    <div className="bg-slate-800/70 backdrop-blur-sm p-3 rounded-lg border border-slate-700 flex items-start justify-between gap-4 transition-all duration-200 hover:bg-slate-700/60 hover:border-slate-600 animate-fade-in h-full">
      <div className="flex items-start gap-4 flex-grow min-w-0">
        <div className={`p-2 rounded-lg ${colorClass} hidden sm:block`}>
          {/* Fix: Explicitly cast the icon's props type to 'any' to satisfy cloneElement's type constraints. */}
          {React.cloneElement(icon as React.ReactElement<any>, { className: 'h-6 w-6' })}
        </div>
        <div className="min-w-0 flex-grow">
          <div className="font-semibold text-white truncate">{title}</div>
          <div className="text-xs text-slate-300 hidden md:block">{description}</div>
        </div>
      </div>
      <div className="text-lg font-bold text-white whitespace-nowrap pl-2">{value}</div>
    </div>
  );
};

export default MetricListItem;