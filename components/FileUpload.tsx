import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
// Fix: Import the shared AllSheetData type.
import { AllSheetData, OperationalCostItem, UserBasedFinancials, OtherExpenseItem, NetProfitContributionItem, ProductHPP } from '../types';

interface FileUploadProps {
  // Fix: Update the onDataLoaded signature to expect the allSheetData object and fileName.
  onDataLoaded: (allSheetData: AllSheetData, fileName: string) => void;
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, isLoading, setLoading, setError }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    // New template structure with additional sheets
    const salesData = [
      { 'No': 1, 'Delivery number': 'JNE001', 'Status pengiriman': 'delivered', 'Seller name': 'User A', 'Remark': '1 QD14', 'Amount item': 1, 'Delivery fee': 20000, 'COD fee': 5000, 'Grand total': 150000, 'Biaya kerusakan': 0, 'Biaya ongkir retur': 0, 'Hpp distributor': 0 },
      { 'No': 2, 'Delivery number': 'JNT002', 'Status pengiriman': 'paid', 'Seller name': 'User B', 'Remark': '1 MT, 1 MR', 'Amount item': 1, 'Delivery fee': 25000, 'COD fee': 5000, 'Grand total': 400000, 'Biaya kerusakan': 0, 'Biaya ongkir retur': 0, 'Hpp distributor': 105000 },
      { 'No': 3, 'Delivery number': 'SICEPAT003', 'Status pengiriman': 'retur selesai', 'Seller name': 'User A', 'Remark': 'HBD', 'Amount item': 1, 'Delivery fee': 15000, 'COD fee': 0, 'Grand total': 100000, 'Biaya kerusakan': 25000, 'Biaya ongkir retur': 10500, 'Hpp distributor': 70000 },
      { 'No': 4, 'Delivery number': 'ANTARAJA004', 'Status pengiriman': 'Proses claim paket rusak / hilang', 'Seller name': 'User B', 'Remark': 'HBN', 'Amount item': 1, 'Delivery fee': 0, 'COD fee': 0, 'Grand total': 200000, 'Biaya kerusakan': 0, 'Biaya ongkir retur': 0, 'Hpp distributor': 0 },
      { 'No': 5, 'Delivery number': 'IDEXPRESS005', 'Status pengiriman': 'Proses Retur', 'Seller name': 'User A', 'Remark': 'QCL14', 'Amount item': 1, 'Delivery fee': 0, 'COD fee': 0, 'Grand total': 120000, 'Biaya kerusakan': 0, 'Biaya ongkir retur': 0, 'Hpp distributor': 0 },
    ];
    // New operational costs template in matrix format
    const opCostsHeaders = ['Seller name', 'IKLAN', 'GAJI POKOK CS', 'BONUS CS', 'GAPOK ADV', 'CASHBON & DENDA DRA', 'BONUS CRM'];
    const opCostsData = [
      opCostsHeaders,
      ['', 5000000, 15000000, 2500000, null, null, null], // General costs
      ['User A', null, null, null, 3000000, 25000, 500000],
      ['User B', null, null, null, 3500000, 50000, 600000],
    ];
    const cashbackData = [
      ['Seller name', 'Amount'],
      ['User A', 100000],
      ['User B', 150000],
    ];
    const komisiMPData = [
      ['Seller name', 'Amount'],
      ['User A', 200000],
      ['User B', 250000],
    ];
    const otherExpensesTemplateData = [
      ['Keterangan', 'Amount'],
      ['Biaya Listrik', 500000],
      ['Biaya Internet', 350000],
      ['GAPOK CRM', 2000000],
      ['BONUS PIC CRM 2%', 1500000],
    ];
    const netProfitContributionTemplateData = [
      ['Keterangan', 'Amount'],
      ['Pendapatan Afiliasi', 750000],
      ['Sponsorship', 1200000],
    ];
    
    const salesSheet = XLSX.utils.json_to_sheet(salesData);
    const opCostsSheet = XLSX.utils.aoa_to_sheet(opCostsData);
    const cashbackSheet = XLSX.utils.aoa_to_sheet(cashbackData);
    const komisiMPSheet = XLSX.utils.aoa_to_sheet(komisiMPData);
    const otherExpensesSheet = XLSX.utils.aoa_to_sheet(otherExpensesTemplateData);
    const netProfitContributionSheet = XLSX.utils.aoa_to_sheet(netProfitContributionTemplateData);
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, salesSheet, "Data Penjualan");
    XLSX.utils.book_append_sheet(workbook, salesSheet, "Data Penjualan CRM");
    XLSX.utils.book_append_sheet(workbook, opCostsSheet, "Biaya Operasional");
    XLSX.utils.book_append_sheet(workbook, cashbackSheet, "CASHBACK");
    XLSX.utils.book_append_sheet(workbook, komisiMPSheet, "Komisi MP");
    XLSX.utils.book_append_sheet(workbook, otherExpensesSheet, "Expanse Lainnya");
    XLSX.utils.book_append_sheet(workbook, netProfitContributionSheet, "Net Profit Contribution");
    
    XLSX.writeFile(workbook, "template_penjualan_lengkap.xlsx");
  };

  const parseExcel = (file: File) => {
    setLoading(true);
    setError(null);
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const salesSheetNames = workbook.SheetNames.filter(name => !["Biaya Operasional", "CASHBACK", "Komisi MP", "Expanse Lainnya", "Net Profit Contribution", "HPP Produk"].includes(name));
        if (salesSheetNames.length === 0) {
            throw new Error("File Excel harus memiliki setidaknya satu sheet untuk 'Data Penjualan'.");
        }

        const allSheetData: AllSheetData = {};

        // Helper to parse user-based financial sheets
        const parseUserBasedSheet = (sheetName: string): UserBasedFinancials => {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) return {};
          const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);
          const result: UserBasedFinancials = {};
          jsonData.forEach(row => {
            const userName = row['Seller name'];
            const amount = row['Amount'];
            if (userName && typeof amount === 'number') {
              result[userName] = (result[userName] || 0) + amount;
            }
          });
          return result;
        };
        
        // New parsing logic for Operational Costs from matrix format
        const opCostsSheet = workbook.Sheets["Biaya Operasional"];
        const opCosts: OperationalCostItem[] = [];
        if (opCostsSheet) {
            const opCostsJson: any[] = XLSX.utils.sheet_to_json(opCostsSheet);
            
            // Get cost headers, excluding the 'Seller name' column
            const costHeaders = Object.keys(opCostsJson[0] || {}).filter(h => h.toLowerCase() !== 'seller name');

            for (const row of opCostsJson) {
                // Skip comment rows (identified by '#' in the first key's value)
                const firstKey = Object.keys(row)[0];
                if (firstKey && typeof row[firstKey] === 'string' && row[firstKey].trim().startsWith('#')) {
                    continue;
                }
                
                const user = row['Seller name']?.trim() || undefined;

                for (const header of costHeaders) {
                    const amount = row[header];
                    // Check if amount is a number and greater than 0
                    if (typeof amount === 'number' && amount > 0) {
                        opCosts.push({
                            name: header.trim(),
                            amount,
                            user: user,
                        });
                    }
                }
            }
        }

        const cashbackData = parseUserBasedSheet("CASHBACK");
        const komisiMPData = parseUserBasedSheet("Komisi MP");
        
        const otherExpensesSheet = workbook.Sheets["Expanse Lainnya"];
        const otherExpensesData: OtherExpenseItem[] = otherExpensesSheet 
            ? XLSX.utils.sheet_to_json(otherExpensesSheet)
            : [];
            
        const netProfitContributionSheet = workbook.Sheets["Net Profit Contribution"];
        const netProfitContributionData: NetProfitContributionItem[] = netProfitContributionSheet
            ? XLSX.utils.sheet_to_json(netProfitContributionSheet)
            : [];
        
        for (const sheetName of salesSheetNames) {
           const sheet = workbook.Sheets[sheetName];
           const salesData = XLSX.utils.sheet_to_json(sheet);
           allSheetData[sheetName] = { salesData, opCosts, cashbackData, komisiMPData, otherExpensesData, netProfitContributionData };
        }
        
        onDataLoaded(allSheetData, file.name);

      } catch (err) {
        console.error("Error processing file:", err);
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memproses file. Periksa format dan konten file.");
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setLoading(false);
      setError("Gagal membaca file.");
    };
    reader.readAsArrayBuffer(file);
  };
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      parseExcel(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    multiple: false,
  });

  return (
    <div className="w-full text-center p-4">
      <div
        {...getRootProps()}
        className={`w-full max-w-2xl mx-auto bg-slate-800/80 p-8 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
          isDragActive ? 'border-sky-400 scale-105' : 'border-slate-700 hover:border-sky-500'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
            <Upload className="h-12 w-12 text-slate-400 mb-4" />
            <p className="text-lg font-semibold text-slate-200">Letakkan file Excel di sini</p>
            <p className="text-slate-400">atau klik untuk menelusuri</p>
        </div>
      </div>
      <div className="mt-6 flex flex-col items-center">
         <button 
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-6 py-3 rounded-lg hover:bg-emerald-500/30 font-semibold transition-all duration-300 transform hover:scale-105"
        >
            <Download size={18} />
            <span>Unduh Template</span>
        </button>
        {fileName && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 px-4 py-2 rounded-lg">
            <FileText size={16} className="text-slate-500" />
            <span>File saat ini: <span className="font-semibold text-slate-300">{fileName}</span></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;