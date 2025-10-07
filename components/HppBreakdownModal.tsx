import React from 'react';
import { X, DollarSign } from 'lucide-react';
import { ProductHPP } from '../types';

interface HppBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  formatCurrency: (value: number) => string;
}

const staticHppData: ProductHPP[] = [
  { 'Nama Produk': 'SA', 'HPP': 25200 },
  { 'Nama Produk': 'SB', 'HPP': 25200 },
  { 'Nama Produk': 'SD', 'HPP': 27600 },
  { 'Nama Produk': 'FW', 'HPP': 21600 },
  { 'Nama Produk': 'TON', 'HPP': 21600 },
  { 'Nama Produk': 'DC', 'HPP': 34200 },
  { 'Nama Produk': 'NC', 'HPP': 34200 },
  { 'Nama Produk': 'QEPT', 'HPP': 33300 },
  { 'Nama Produk': 'TZ', 'HPP': 20000 },
  { 'Nama Produk': 'AQT', 'HPP': 40000 },
  { 'Nama Produk': 'CR', 'HPP': 80000 },
  { 'Nama Produk': 'ARM', 'HPP': 21500 },
  { 'Nama Produk': 'CC', 'HPP': 19000 },
  { 'Nama Produk': 'HBD', 'HPP': 17000 },
  { 'Nama Produk': 'HBN', 'HPP': 17000 },
  { 'Nama Produk': 'HRB', 'HPP': 36500 },
  { 'Nama Produk': 'SS', 'HPP': 22000 },
  { 'Nama Produk': 'QTP', 'HPP': 18640 },
  { 'Nama Produk': 'QTH', 'HPP': 18640 },
  { 'Nama Produk': 'QJ', 'HPP': 17000 },
  { 'Nama Produk': 'QD', 'HPP': 46000 },
  { 'Nama Produk': 'SL', 'HPP': 17000 },
  { 'Nama Produk': 'QASpt', 'HPP': 14430 },
  { 'Nama Produk': 'MT', 'HPP': 1100 },
  { 'Nama Produk': 'QD14', 'HPP': 61000 },
  { 'Nama Produk': 'QCL14', 'HPP': 50000 },
  { 'Nama Produk': 'MR', 'HPP': 1100 },
  { 'Nama Produk': 'EMAS', 'HPP': 6000 },
  { 'Nama Produk': 'MELVIT', 'HPP': 46000 },
].sort((a, b) => a['Nama Produk'].localeCompare(b['Nama Produk']));

const HppBreakdownModal: React.FC<HppBreakdownModalProps> = ({ isOpen, onClose, formatCurrency }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-slate-800/80 border border-slate-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-500/20 text-slate-400 rounded-lg">
                <DollarSign className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-white">Database HPP Produk</h1>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full">
            <X size={20} />
          </button>
        </div>

        {staticHppData.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>Database HPP kosong.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {staticHppData.map((item) => {
              const name = item['Nama Produk'];
              const unitHpp = item['HPP'];
              return (
                <div key={name} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg hover:bg-slate-700 transition-colors">
                  <p className="text-slate-200 font-medium truncate" title={name}>{name}</p>
                  <p className="text-white font-bold whitespace-nowrap">
                    {formatCurrency(unitHpp)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HppBreakdownModal;