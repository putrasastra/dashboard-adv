import React from 'react';
import { SalesData } from '../types';
import { Truck, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DeliveryDetailsTableProps {
  data: SalesData[];
}

const DeliveryDetailsTable: React.FC<DeliveryDetailsTableProps> = ({ data }) => {
  const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number') return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };
  
  const headers = [
    'No', 'Delivery number', 'Status pengiriman', 'Seller name', 'Remark', 
    'Amount item', 'Delivery fee', 'COD fee', 'Grand total', 'Biaya kerusakan', 
    'Biaya ongkir retur', 'Hpp distributor'
  ];

  const handleExport = () => {
    if (data.length === 0) return;
    // Create a new dataset for export with re-indexed numbers
    const exportData = data.map((row, index) => ({
      ...row,
      'No': index + 1,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rincian Pengiriman");
    XLSX.writeFile(workbook, "rincian_data_pengiriman.xlsx");
  };

  return (
    <div className="bg-slate-800/70 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 shadow-lg">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <Truck className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-white">Rincian Data Pengiriman</h3>
        </div>
        <button
          onClick={handleExport}
          disabled={data.length === 0}
          className="flex items-center gap-2 bg-slate-700/50 text-slate-300 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-slate-600/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          <span>Export Excel</span>
        </button>
      </div>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-center text-slate-400">
          <p>Tidak ada data pengiriman untuk ditampilkan.</p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[500px] scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-200 uppercase bg-slate-700/50 sticky top-0">
              <tr>
                {headers.map(header => (
                  <th key={header} scope="col" className="px-4 py-3 whitespace-nowrap">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={row['Delivery number'] || index} className="border-b border-slate-700 hover:bg-slate-700/40">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{row['Delivery number'] || '-'}</td>
                  <td className="px-4 py-3">
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        row['Status pengiriman']?.toLowerCase() === 'delivered' || row['Status pengiriman']?.toLowerCase() === 'paid' ? 'bg-green-500/20 text-green-300' :
                        row['Status pengiriman']?.toLowerCase().includes('retur') ? 'bg-red-500/20 text-red-300' :
                        row['Status pengiriman']?.toLowerCase() === 'on delivery' ? 'bg-cyan-500/20 text-cyan-300' :
                        row['Status pengiriman']?.toLowerCase().includes('process') ? 'bg-orange-500/20 text-orange-300' :
                        'bg-slate-600 text-slate-200'
                     }`}>
                        {row['Status pengiriman'] || '-'}
                     </span>
                  </td>
                  <td className="px-4 py-3">{row['Seller name'] || '-'}</td>
                  <td className="px-4 py-3 max-w-xs truncate" title={row['Remark']}>{row['Remark'] || '-'}</td>
                  <td className="px-4 py-3 text-center">{row['Amount item'] || '-'}</td>
                  <td className="px-4 py-3">{formatCurrency(row['Delivery fee'])}</td>
                  <td className="px-4 py-3">{formatCurrency(row['COD fee'])}</td>
                  <td className="px-4 py-3 font-semibold text-white">{formatCurrency(row['Grand total'])}</td>
                  <td className="px-4 py-3">{formatCurrency(row['Biaya kerusakan'])}</td>
                  <td className="px-4 py-3">{formatCurrency(row['Biaya ongkir retur'])}</td>
                  <td className="px-4 py-3">{formatCurrency(row['Hpp distributor'])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DeliveryDetailsTable;