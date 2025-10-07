import React from 'react';
import { X } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
  activeSheet: string;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose, activeSheet }) => {
  const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-sky-300 mb-3 border-b-2 border-sky-300/20 pb-2">{title}</h2>
      <div className="space-y-2 text-slate-300">{children}</div>
    </div>
  );

  const MetricDetail: React.FC<{ name: string; formula: string }> = ({ name, formula }) => (
    <li className="p-3 bg-slate-700/50 rounded-lg">
      <p className="font-semibold text-slate-100">{name}</p>
      <p className="text-xs text-slate-400 font-mono whitespace-pre-wrap">{formula}</p>
    </li>
  );
  
  const renderInstructions = () => {
    switch (activeSheet) {
      case 'ADV':
        return (
          <>
            <p>Menu <strong>ADV</strong> fokus pada kinerja tim Advertiser. Dashboard ini merinci metrik yang relevan untuk perhitungan komisi ADV, termasuk profit yang dihasilkan dari penjualan langsung dan kontribusi dari tim CRM.</p>
            <p>Anda dapat menggunakan filter 'Pengguna' untuk menganalisis kinerja per-individu atau secara keseluruhan.</p>
          </>
        );
      case 'CRM':
        return (
          <>
            <p>Menu <strong>CRM</strong> didedikasikan untuk mengukur efektivitas tim Customer Relationship Management. Metrik di sini menunjukkan profitabilitas dari aktivitas CRM, yang kemudian dibagi antara keuntungan untuk perusahaan (CUAN) dan kontribusi untuk komisi tim ADV.</p>
             <p>Anda dapat menggunakan filter 'Pengguna' untuk menganalisis kinerja per-individu atau secara keseluruhan.</p>
          </>
        );
      default:
        return (
          <p>Aplikasi ini dirancang untuk menghitung metrik bisnis secara otomatis dari data penjualan Anda. Cukup unggah file Excel yang sudah diformat sesuai template, dan dasbor akan menampilkan semua kalkulasi secara instan.</p>
        );
    }
  };
  
  const renderAdvMetrics = () => (
    <ul className="space-y-2 text-sm">
      <MetricDetail name="GROSS OMSET" formula="SUM('Grand total') dari SEMUA status pengiriman." />
      <MetricDetail name="NET OMSET" formula="[NET SALES] - [ONGKIR] - [FEE COD]" />
      <MetricDetail name="NET SALES" formula="SUM('Grand total') dari status 'paid' dan 'delivered'." />
      <MetricDetail name="ON DELIVERY" formula="SUM('Grand total') dari status 'on delivery'." />
      <MetricDetail name="OMSET PROSES KLAIM" formula="SUM('Grand total') dari status 'proses claim paket rusak / hilang'." />
      <MetricDetail name="OMSET PROSES RETUR" formula="SUM('Grand total') dari status 'proses retur'." />
      <MetricDetail name="LOSS OMSET RETURN" formula="SUM('Grand total') dari status 'retur selesai' & 'retur terkunci'." />
      <MetricDetail name="HPP" formula="SUM(HPP per produk * jumlah produk terjual) dari sheet 'HPP Produk' untuk penjualan berstatus 'paid' & 'delivered'." />
      <MetricDetail name="ONGKIR" formula="SUM('Delivery fee') dari penjualan berstatus 'paid' & 'delivered'." />
      <MetricDetail name="FEE COD" formula="SUM('COD fee') dari penjualan berstatus 'paid' & 'delivered'." />
      <MetricDetail name="IKLAN" formula="Total biaya 'IKLAN' dari sheet 'Biaya Operasional'." />
      <MetricDetail name="GAJI POKOK CS" formula="Total biaya 'GAJI POKOK CS' dari sheet 'Biaya Operasional'." />
      <MetricDetail name="BONUS CS" formula="Total biaya 'BONUS CS' dari sheet 'Biaya Operasional'." />
      <MetricDetail name="CASHBON & DENDA DRA" formula="Total biaya 'CASHBON & DENDA DRA' dari sheet 'Biaya Operasional'." />
      <MetricDetail name="CASHBACK" formula="Total 'Amount' dari sheet 'CASHBACK' untuk pengguna terpilih." />
      <MetricDetail name="BIAYA RETUR" formula="SUM('Biaya ongkir retur') dari penjualan berstatus 'retur terkunci' & 'retur selesai'." />
      <MetricDetail name="BIAYA KERUSAKAN RETUR" formula="SUM('Biaya kerusakan') dari penjualan berstatus 'retur selesai'." />
      <MetricDetail name="NET PROFIT BY ADVERTISER" formula="([NET SALES] + [CASHBACK]) - ([HPP] + [ONGKIR] + [FEE COD] + [IKLAN] + [GAJI POKOK CS] + [BONUS CS] + [BIAYA RETUR] + [BIAYA KERUSAKAN RETUR])" />
      <MetricDetail name="NET PROFIT TO ADV 80% (CRM)" formula="80% dari [NET PROFIT CRM] (dari menu CRM)." />
      <MetricDetail name="Total Net Profit (ADV+CRM)" formula="[NET PROFIT BY ADVERTISER] + [NET PROFIT TO ADV 80% (CRM)]" />
      <MetricDetail 
        name="KOMISI ADV" 
        formula={`Dasar Komisi: [Total Net Profit (ADV+CRM)].
- Jika Dasar Komisi negatif, Komisi ADV = nilai negatif tersebut.
- Jika positif, gunakan pengali persentase berdasarkan [NET OMSET]:
  - < 70jt = 16%
  - 70jt – 79jt = 17%
  - 80jt – 89jt = 18%
  - 90jt – 99jt = 19%
  - ≥ 100jt = 20%`} 
      />
      <MetricDetail name="KOMISI MP" formula="Total 'Amount' dari sheet 'Komisi MP' untuk pengguna terpilih." />
      <MetricDetail name="KOMISI ADV FIX" formula="[KOMISI ADV] + [KOMISI MP] - [CASHBON & DENDA DRA]" />
    </ul>
  );

  const renderCrmMetrics = () => (
    <ul className="space-y-2 text-sm">
      <MetricDetail name="GROSS OMSET" formula="SUM('Grand total') dari SEMUA status pengiriman pada sheet 'Data Penjualan CRM'." />
      <MetricDetail name="NET OMSET" formula="[NET SALES] - [ONGKIR] - [FEE COD] (dari data CRM)." />
      <MetricDetail name="NET PROFIT CRM" formula="[NET SALES] - ([HPP] + [FEE COD] + [ONGKIR] + [BIAYA ONGKIR RETUR] + [BIAYA KERUSAKAN RETUR] + [BONUS CRM]) (semua dari data CRM)." />
      <MetricDetail name="NET PROFIT TO ADV 80%" formula="80% * [NET PROFIT CRM]" />
      <MetricDetail name="TOTAL NET PROFIT CRM CUAN" formula="[NET PROFIT CRM] - [NET PROFIT TO ADV 80%] - [GAPOK CRM] - [BIAYA OPERASIONAL LAINNYA]" />
      <MetricDetail name="NET SALES" formula="SUM('Grand total') dari status 'paid' & 'delivered' (dari data CRM)." />
      <MetricDetail name="ON DELIVERY" formula="SUM('Grand total') dari status 'on delivery' (dari data CRM)." />
      <MetricDetail name="PROSES KLAIM" formula="SUM('Grand total') dari status 'proses claim...' (dari data CRM)." />
      <MetricDetail name="PROSES RETUR" formula="SUM('Grand total') dari status 'proses retur' (dari data CRM)." />
      <MetricDetail name="RETUR SELESAI DAN TERKUNCI" formula="SUM('Grand total') dari status 'retur selesai' & 'terkunci' (dari data CRM)." />
      <MetricDetail name="HPP" formula="SUM(HPP per produk * jumlah produk terjual) dari sheet 'HPP Produk' untuk penjualan berstatus 'paid' & 'delivered' (dari data CRM)." />
      <MetricDetail name="ONGKIR" formula="SUM('Delivery fee') dari penjualan terkirim (dari data CRM)." />
      <MetricDetail name="FEE COD" formula="SUM('COD fee') dari penjualan terkirim (dari data CRM)." />
      <MetricDetail name="BIAYA ONGKIR RETUR" formula="SUM('Biaya ongkir retur') dari penjualan retur (dari data CRM)." />
      <MetricDetail name="BIAYA KERUSAKAN RETUR" formula="SUM('Biaya kerusakan') dari penjualan retur (dari data CRM)." />
      <MetricDetail name="BONUS CRM" formula="Total biaya 'BONUS CRM' dari sheet 'Biaya Operasional'." />
      <MetricDetail name="GAPOK CRM" formula="Total biaya 'GAPOK CRM' dari sheet 'Expanse Lainnya'." />
    </ul>
  );
  
  const renderMetrics = () => {
    switch(activeSheet) {
      case 'ADV': return renderAdvMetrics();
      case 'CRM': return renderCrmMetrics();
      default: return (
        <p className="text-slate-400">Pilih menu (ADV atau CRM) untuk melihat rincian rumus yang relevan.</p>
      );
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-slate-800/80 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-white">Petunjuk Penggunaan: Menu {activeSheet}</h1>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="text-sm">
          <HelpSection title="Cara Kerja">
            {renderInstructions()}
          </HelpSection>

          <HelpSection title={`Rincian Rumus Metrik (Menu ${activeSheet})`}>
            {renderMetrics()}
          </HelpSection>
          
          <HelpSection title="Struktur File Excel">
            <p>Pastikan file Excel Anda memiliki sheet-sheet berikut. Sheet penjualan tambahan akan diproses secara individual.</p>
            <div className="p-4 bg-slate-900/50 rounded-lg space-y-4">
              <div>
                <p><strong className="text-slate-100">1. Data Penjualan & Data Penjualan CRM:</strong></p>
                <p className="text-xs text-slate-400">Sheet ini berisi data transaksi utama. Kolom yang dibutuhkan:</p>
                <code className="block text-xs text-sky-300 bg-slate-800 p-2 rounded mt-1">No, Delivery number, Status pengiriman, Seller name, Remark, Amount item, Delivery fee, COD fee, Grand total, Biaya kerusakan, Biaya ongkir retur, Hpp distributor</code>
              </div>
              <div>
                <p><strong className="text-slate-100">2. Biaya Operasional:</strong></p>
                <p className="text-xs text-slate-400">
                  Sheet ini bernama "Biaya Operasional" dan menggunakan format tabel. Biaya umum (berlaku untuk semua) diletakkan pada baris dengan 'Seller name' kosong.
                </p>
                <code className="block text-xs text-sky-300 bg-slate-800 p-2 rounded mt-1 whitespace-pre-wrap">
{`Contoh Format:
| Seller name | IKLAN    | ... | GAPOK ADV | ... |
|-------------|----------|-----|-----------|-----|
|             | 5000000  | ... |           | ... |  <- Biaya Umum
| User A      |          | ... | 3000000   | ... |  <- Biaya untuk User A
`}
                </code>
              </div>
              <div>
                <p><strong className="text-slate-100">3. CASHBACK, Komisi MP:</strong></p>
                <p className="text-xs text-slate-400">Sheet opsional untuk data per pengguna.</p>
                <code className="block text-xs text-sky-300 bg-slate-800 p-2 rounded mt-1">Kolom A: Seller name | Kolom B: Amount</code>
              </div>
              <div>
                <p><strong className="text-slate-100">4. Expanse Lainnya, Net Profit Contribution:</strong></p>
                <p className="text-xs text-slate-400">Sheet opsional untuk biaya atau pendapatan lain-lain.</p>
                <code className="block text-xs text-sky-300 bg-slate-800 p-2 rounded mt-1">Kolom A: Keterangan | Kolom B: Amount</code>
              </div>
              <div>
                <p><strong className="text-slate-100">5. HPP Produk:</strong></p>
                <p className="text-xs text-slate-400">Sheet baru dan wajib untuk kalkulasi HPP yang akurat. Kolom 'Hpp distributor' pada sheet penjualan akan diabaikan.</p>
                <code className="block text-xs text-sky-300 bg-slate-800 p-2 rounded mt-1">Kolom A: Nama Produk | Kolom B: HPP</code>
              </div>
            </div>
          </HelpSection>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;