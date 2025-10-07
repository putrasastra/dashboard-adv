import React from 'react';
import { Calculator } from 'lucide-react';

interface CommissionBreakdownCardProps {
  netProfitByAdvertiser: number;
  netProfitToAdv: number;
  komisiAdvPercentage: number;
  komisiAdv: number;
  formatCurrency: (value: number) => string;
}

const CommissionBreakdownCard: React.FC<CommissionBreakdownCardProps> = ({
  netProfitByAdvertiser,
  netProfitToAdv,
  komisiAdvPercentage,
  komisiAdv,
  formatCurrency,
}) => {
  const totalBaseKomisi = netProfitByAdvertiser + netProfitToAdv;

  return (
    <div className="bg-slate-800/70 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 shadow-lg animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
          <Calculator className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-white">Breakdown Perhitungan</h3>
      </div>
      
      <div className="text-sm space-y-4">
        {/* Base Komisi Section */}
        <div>
          <h4 className="font-semibold text-slate-300 mb-2 pb-1 border-b border-slate-700">Base Komisi</h4>
          <div className="space-y-1 text-slate-300">
            <div className="flex justify-between items-center p-1">
              <span>NET PROFIT BY ADVERTISER</span>
              <span className="font-mono text-slate-200">{formatCurrency(netProfitByAdvertiser)}</span>
            </div>
            <div className="flex justify-between items-center p-1">
              <span>+ NET PROFIT TO ADV 80% (CRM)</span>
              <span className="font-mono text-slate-200">{formatCurrency(netProfitToAdv)}</span>
            </div>
          </div>
          <div className="mt-2 p-2 bg-slate-900/50 rounded-md flex justify-between items-center font-bold text-slate-100 border-t-2 border-indigo-400">
            <span>Total Base Komisi</span>
            <span>{formatCurrency(totalBaseKomisi)}</span>
          </div>
        </div>

        {/* Perhitungan Komisi Section */}
        <div>
          <h4 className="font-semibold text-slate-300 mb-2 pb-1 border-b border-slate-700">Perhitungan Komisi</h4>
          <div className="space-y-2 text-slate-300">
            <div className="flex justify-between items-center p-1 text-slate-400">
              <span className="font-mono">{formatCurrency(totalBaseKomisi)} &times; {(komisiAdvPercentage * 100).toFixed(0)}%</span>
              <span className="font-mono text-slate-200">{formatCurrency(komisiAdv)}</span>
            </div>
          </div>
          <div className="mt-2 p-3 bg-emerald-500/20 rounded-md flex justify-between items-center font-bold text-lg text-emerald-300 border-t-2 border-emerald-400">
            <span>KOMISI ADV</span>
            <span>{formatCurrency(komisiAdv)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionBreakdownCard;
