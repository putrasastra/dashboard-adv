import React from 'react';

interface MetricCardProps {
  title: React.ReactNode;
  value: React.ReactNode;
  icon: React.ReactNode;
  description: React.ReactNode;
  colorClass: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, description, colorClass }) => {
  return (
    <div className="bg-slate-800/70 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 shadow-lg transform hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <div className="flex items-start justify-between">
        <div className="space-y-1 w-full">
          <div className="text-sm font-medium text-slate-200">{title}</div>
          <div className="text-3xl font-bold text-white">{value}</div>
        </div>
        <div className={`p-3 rounded-lg ${colorClass} ml-4`}>
          {icon}
        </div>
      </div>
      <div className="text-xs text-slate-300 mt-4 flex-grow">{description}</div>
    </div>
  );
};

export default MetricCard;