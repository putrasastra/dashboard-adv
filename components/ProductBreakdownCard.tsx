import React from 'react';
import { Boxes } from 'lucide-react';

interface ProductBreakdownCardProps {
  data: { [key: string]: number };
}

const ProductBreakdownCard: React.FC<ProductBreakdownCardProps> = ({ data }) => {
  // Fix: The values from Object.entries are not being correctly inferred as numbers, causing type errors.
  // Casting to [string, number][] ensures proper typing for sort and map operations.
  const productEntries = (Object.entries(data) as [string, number][]).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-slate-800/70 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 shadow-lg h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
          <Boxes className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-white">Rincian Penjualan Produk</h3>
      </div>
      {productEntries.length === 0 ? (
        <div className="flex items-center justify-center h-full text-center text-slate-400">
            <p className="text-sm">Tidak ada data produk terjual (status 'paid' atau 'delivered') untuk ditampilkan.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 lg:max-h-full overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50">
          {productEntries.map(([name, count]) => (
            <div key={name} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg hover:bg-slate-700 transition-colors">
              <p className="text-slate-200 font-medium truncate text-sm" title={name}>{name}</p>
              {/* Fix: Use Intl.NumberFormat for locale-specific number formatting to resolve the error about unexpected arguments. */}
              <p className="text-white font-bold bg-slate-600 px-2.5 py-1 text-sm rounded-full flex-shrink-0 ml-4">{new Intl.NumberFormat('id-ID').format(count)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductBreakdownCard;