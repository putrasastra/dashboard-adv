import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Info, BarChart2, Percent, DollarSign, CheckCircle, TrendingUp, User, FileDown, ChevronDown } from 'lucide-react';
import { CalculatedMetrics, AllSheetData } from '../types';
import { processSalesData } from '../services/dataProcessor';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

interface CommissionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: CalculatedMetrics | null; // Aggregated metrics for 'All Users'
  netProfitCrm: number; // Aggregated net profit from CRM
  netProfitToAdv: number; // Aggregated profit share for ADV from CRM
  selectedUser: string; // The user selected on the main page
  formatCurrency: (value: number) => string;
  allSheetData: AllSheetData | null; // Full dataset
  userList: string[]; // List of advertisers for the filter
  netProfitToAdvPerUser: { [userName: string]: number }; // Per-user profit share from CRM
}

const CommissionSummaryModal: React.FC<CommissionSummaryModalProps> = ({
  isOpen,
  onClose,
  metrics,
  netProfitCrm,
  netProfitToAdv,
  selectedUser,
  formatCurrency,
  allSheetData,
  userList,
  netProfitToAdvPerUser
}) => {
  const [currentUser, setCurrentUser] = useState(selectedUser);
  const [isExporting, setIsExporting] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // When the modal is re-opened, sync its state with the main page's selection
  useEffect(() => {
    if (isOpen) {
      setCurrentUser(selectedUser);
    }
  }, [isOpen, selectedUser]);
  
  const derivedModalData = useMemo(() => {
    // If we're looking at all users, use the pre-calculated props
    if (currentUser === 'Semua Pengguna' || !allSheetData) {
        return {
            displayMetrics: metrics,
            displayNetProfitToAdv: netProfitToAdv,
            displayNetProfitCrm: netProfitCrm,
        };
    }
    
    // If a specific user is selected, recalculate everything for them
    const advSheet = allSheetData['Data Penjualan'];
    if (!advSheet) { // Fallback
        return { displayMetrics: null, displayNetProfitToAdv: 0, displayNetProfitCrm: 0 };
    }
    
    const userNetProfitToAdv = netProfitToAdvPerUser[currentUser] || 0;
    
    const userMetrics = processSalesData(
      advSheet.salesData, advSheet.opCosts, advSheet.cashbackData, advSheet.komisiMPData,
      advSheet.otherExpensesData, advSheet.netProfitContributionData,
      currentUser,
      0, // crmNetProfitForCommission (total) is not relevant for this modal display
      userNetProfitToAdv,
      netProfitToAdvPerUser
    );
    
    // We also need the user's "Net Profit CRM" value for display.
    // It's the base from which their "net profit to adv" is calculated.
    const userNetProfitCrm = userNetProfitToAdv / 0.8;

    return {
        displayMetrics: userMetrics,
        displayNetProfitToAdv: userNetProfitToAdv,
        displayNetProfitCrm: userNetProfitCrm,
    };
  }, [currentUser, metrics, netProfitToAdv, netProfitCrm, allSheetData, netProfitToAdvPerUser]);

  const { displayMetrics, displayNetProfitToAdv, displayNetProfitCrm } = derivedModalData;

  const handleExportExcel = () => {
    if (isExporting || !displayMetrics) return;
    setIsExporting(true);

    // Use setTimeout to allow UI to re-render with loading state
    setTimeout(() => {
      try {
        const netOmset = displayMetrics.omsetPaidDelivered - displayMetrics.ongkir - displayMetrics.feeCod;
        const totalBaseKomisi = displayMetrics.netProfitByAdvertiser + displayNetProfitToAdv;

        const wb = XLSX.utils.book_new();
        const ws_data = [
          ["Ringkasan Komisi ADV"],
          [`Pengguna: ${currentUser}`],
          [`Tanggal Export: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`],
          [], // Spacer
          ["Data Dasar Perhitungan"],
          ["NET SALES", displayMetrics.omsetPaidDelivered],
          ["Ongkir", displayMetrics.ongkir],
          ["Fee COD", displayMetrics.feeCod],
          ["NET OMSET", netOmset],
          ["NET PROFIT BY ADVERTISER", displayMetrics.netProfitByAdvertiser],
          ["Net Profit CRM", displayNetProfitCrm],
          ["NET PROFIT TO ADV 80% (CRM)", displayNetProfitToAdv],
          [], // Spacer
          ["% Tier Komisi"],
          ["Kategori NET OMSET", `${getTierCategory(netOmset)} (${(displayMetrics.komisiAdvPercentage * 100).toFixed(0)}%)`],
          ["Rate Komisi", `${(displayMetrics.komisiAdvPercentage * 100).toFixed(0)}%`],
          [], // Spacer
          ["Breakdown Perhitungan"],
          ["Base Komisi:", ""],
          ["  NET PROFIT BY ADVERTISER", displayMetrics.netProfitByAdvertiser],
          ["  + NET PROFIT TO ADV 80% (CRM)", displayNetProfitToAdv],
          ["  Total Base Komisi", totalBaseKomisi],
          ["Perhitungan Komisi:", ""],
          [`  ${formatCurrency(totalBaseKomisi)} x ${(displayMetrics.komisiAdvPercentage * 100).toFixed(0)}%`, displayMetrics.komisiAdv],
          ["KOMISI ADV", displayMetrics.komisiAdv],
          [], // Spacer
          ["Total Komisi Final"],
          ["KOMISI ADV", displayMetrics.komisiAdv],
          ["KOMISI MP", displayMetrics.komisiMP],
          ["(-) Cashbon & Denda DRA", displayMetrics.cashbonDendaDra],
          ["KOMISI ADV FIX (Total)", displayMetrics.komisiAdvFix]
        ];

        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        ws['!cols'] = [{ wch: 40 }, { wch: 20 }]; // Set column widths
        XLSX.utils.book_append_sheet(wb, ws, "Ringkasan Komisi");
        XLSX.writeFile(wb, `Ringkasan_Komisi_${currentUser.replace(/\s+/g, '_')}.xlsx`);
      } catch (error) {
          console.error("Failed to export Excel:", error);
      } finally {
          setIsExporting(false);
      }
    }, 50);
  };
  
const handleExportPdf = async () => {
    const input = modalContentRef.current;
    if (!input || isExporting) return;

    setIsExporting(true);

    try {
        const clone = input.cloneNode(true) as HTMLElement;

        // Find and remove interactive elements that shouldn't be in the PDF
        const closeBtn = clone.querySelector('#commission-summary-close-btn');
        const exportBtns = clone.querySelector('#commission-summary-export-buttons');
        const userSelector = clone.querySelector('#commission-summary-user-selector');
        
        if (closeBtn) closeBtn.remove();
        if (exportBtns) exportBtns.remove();
        if (userSelector) userSelector.remove();
        
        // Find the header info section to append the static user name
        const headerInfo = clone.querySelector('#commission-summary-header-info');
        if (headerInfo) {
            // Find the inner div that contains the title and date
            const headerTextContainer = headerInfo.querySelector('div:last-child');
            if (headerTextContainer) {
                // Create a new element for the user name
                const userTextElement = document.createElement('p');
                userTextElement.className = 'text-sm text-slate-400 mt-1'; // Add some margin for spacing
                userTextElement.textContent = `Pengguna: ${currentUser}`;
                headerTextContainer.appendChild(userTextElement);
            }
        }
        
        clone.style.position = 'absolute';
        clone.style.top = '0';
        clone.style.left = '-9999px';
        clone.style.width = '1200px';
        clone.style.maxHeight = 'none';
        clone.style.overflow = 'visible';

        document.body.appendChild(clone);

        const canvas = await html2canvas(clone, {
            scale: 2.5,
            useCORS: true,
            backgroundColor: '#0f172a',
        });

        document.body.removeChild(clone);

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        
        const margin = 10;
        const availableWidth = pdfWidth - margin * 2;
        const availableHeight = pdfHeight - margin * 2;
        
        const widthRatio = availableWidth / imgProps.width;
        const heightRatio = availableHeight / imgProps.height;
        const ratio = Math.min(widthRatio, heightRatio);
        
        const finalWidth = imgProps.width * ratio;
        const finalHeight = imgProps.height * ratio;
        
        const x = (pdfWidth - finalWidth) / 2;
        const y = margin;
        
        pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
        pdf.save(`Ringkasan_Komisi_${currentUser.replace(/\s+/g, '_')}.pdf`);

    } catch (error) {
        console.error("Failed to export PDF:", error);
    } finally {
        setIsExporting(false);
    }
};


  if (!isOpen || !displayMetrics) return null;

  const netOmset = displayMetrics.omsetPaidDelivered - displayMetrics.ongkir - displayMetrics.feeCod;
  const totalBaseKomisi = displayMetrics.netProfitByAdvertiser + displayNetProfitToAdv;

  const getTierCategory = (netOmset: number) => {
    const omsetJuta = netOmset / 1_000_000;

    if (omsetJuta < 70) return "< 70 Juta";
    if (omsetJuta < 80) return "70-79 Juta";
    if (omsetJuta < 90) return "80-89 Juta";
    if (omsetJuta < 100) return "90-99 Juta";
    return "≥ 100 Juta";
  };

  const tierCategory = getTierCategory(netOmset);
  const commissionRate = `${(displayMetrics.komisiAdvPercentage * 100).toFixed(0)}%`;

  const DetailRow = ({ label, value, highlighted = false, isSub = false }: {label: React.ReactNode, value: number, highlighted?: boolean, isSub?: boolean}) => (
    <div className={`flex justify-between items-center py-2 px-3 rounded-md ${highlighted ? 'bg-slate-700 font-semibold' : ''} ${isSub ? 'text-sm' : ''}`}>
      <span className={highlighted ? 'text-sky-300' : 'text-slate-300'}>{label}</span>
      <span className={`font-mono ${highlighted ? 'text-white' : 'text-slate-200'}`}>{formatCurrency(value)}</span>
    </div>
  );
  
  type SectionProps = {
    icon: React.ReactNode;
    title: string;
  };
  
  const Section: React.FC<React.PropsWithChildren<SectionProps>> = ({ icon, title, children }) => (
     <div>
        <div className="flex items-center gap-3 mb-3">
            {icon}
            <h3 className="text-md font-semibold text-slate-200">{title}</h3>
        </div>
        <div className="space-y-1 bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
            {children}
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div
        ref={modalContentRef}
        className="bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-6 gap-4">
          <div id="commission-summary-header-info" className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                  <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                  <h2 className="text-2xl font-bold text-white">Ringkasan Komisi ADV</h2>
                  <p className="text-sm text-slate-400">Tanggal Export: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              {userList.length > 0 && (
                <div id="commission-summary-user-selector" className="flex items-center gap-2">
                  <User size={16} className="text-slate-400"/>
                  <div className="relative">
                      <select 
                          value={currentUser} 
                          onChange={(e) => setCurrentUser(e.target.value)}
                          className="appearance-none bg-slate-800 border border-slate-600 rounded-lg pl-3 pr-8 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                          {userList.map(user => <option key={user} value={user}>{user}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                          <ChevronDown size={16} />
                      </div>
                  </div>
                </div>
              )}
              <div id="commission-summary-export-buttons" className="flex items-center gap-2">
                <button onClick={handleExportExcel} disabled={isExporting} className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-emerald-500/30 transition-all disabled:opacity-60 disabled:cursor-wait">
                    <FileDown size={16} />
                    <span>{isExporting ? 'Memproses...' : 'Excel'}</span>
                </button>
                <button onClick={handleExportPdf} disabled={isExporting} className="flex items-center gap-2 bg-red-500/20 text-red-300 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition-all disabled:opacity-60 disabled:cursor-wait">
                    <FileDown size={16} />
                    <span>{isExporting ? 'Memproses...' : 'PDF'}</span>
                </button>
              </div>
          </div>
          <button id="commission-summary-close-btn" onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors sm:static">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
            {/* Column 1: Data Dasar & Tier */}
            <div className="lg:col-span-1 space-y-6">
                 <Section icon={<Info size={20} className="text-sky-400"/>} title="Data Dasar Perhitungan">
                    <DetailRow label="NET SALES" value={displayMetrics.omsetPaidDelivered} />
                    <DetailRow label="Ongkir" value={displayMetrics.ongkir} />
                    <DetailRow label="Fee COD" value={displayMetrics.feeCod} />
                    <div className="border-t border-slate-700 my-1"></div>
                    <DetailRow label="NET OMSET" value={netOmset} highlighted />
                     <div className="border-t border-slate-700 my-1"></div>
                    <DetailRow label="NET PROFIT BY ADVERTISER" value={displayMetrics.netProfitByAdvertiser} />
                    <DetailRow label="Net Profit CRM" value={displayNetProfitCrm} />
                    <div className="border-t border-slate-700 my-1"></div>
                    <DetailRow label="NET PROFIT TO ADV 80% (CRM)" value={displayNetProfitToAdv} highlighted/>
                </Section>
                
                <Section icon={<Percent size={20} className="text-sky-400"/>} title="% Tier Komisi">
                    <div className="p-3">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-slate-300">Kategori NET OMSET:</span>
                           <span className="font-semibold bg-slate-700 text-sky-300 px-3 py-1 rounded-full text-sm">{`${tierCategory} (${commissionRate})`}</span>
                        </div>
                         <div className="flex justify-between items-center">
                           <span className="text-slate-300">Rate Komisi:</span>
                           <span className="font-bold text-white text-lg">{commissionRate}</span>
                        </div>
                    </div>
                     <div className="border-t border-slate-700 my-1"></div>
                     <div className="text-xs text-slate-400 p-3 space-y-1">
                        <p className="font-semibold text-slate-300">Struktur Tier Komisi:</p>
                        <p>&bull; &lt; 70 Juta = 16%</p>
                        <p>&bull; 70-79 Juta = 17%</p>
                        <p>&bull; 80-89 Juta = 18%</p>
                        <p>&bull; 90-99 Juta = 19%</p>
                        <p>&bull; ≥ 100 Juta = 20%</p>
                     </div>
                </Section>
            </div>
            
            {/* Column 2: Breakdown & Total */}
            <div className="lg:col-span-2 space-y-6">
                <Section icon={<BarChart2 size={20} className="text-sky-400"/>} title="Breakdown Perhitungan">
                    <h4 className="font-semibold text-slate-300 text-sm px-3 pt-2">Base Komisi:</h4>
                    <DetailRow label="NET PROFIT BY ADVERTISER" value={displayMetrics.netProfitByAdvertiser} isSub />
                    <DetailRow label="+ NET PROFIT TO ADV 80% (CRM)" value={displayNetProfitToAdv} isSub />
                    <div className="!mt-2">
                      <DetailRow label="Total Base Komisi" value={totalBaseKomisi} highlighted />
                    </div>
                    
                    <h4 className="font-semibold text-slate-300 text-sm px-3 pt-4">Perhitungan Komisi:</h4>
                    <div className="flex justify-between items-center py-2 px-3 text-slate-400 text-sm">
                      <span className="font-mono">{formatCurrency(totalBaseKomisi)} &times; {commissionRate}</span>
                      <span className="font-mono text-slate-200">{formatCurrency(displayMetrics.komisiAdv)}</span>
                    </div>
                    <div className="p-3 bg-emerald-600/30 rounded-md flex justify-between items-center font-bold text-lg text-emerald-300 border-t-2 border-emerald-500 !mt-2">
                      <span>KOMISI ADV</span>
                      <span>{formatCurrency(displayMetrics.komisiAdv)}</span>
                    </div>
                </Section>
                
                <Section icon={<DollarSign size={20} className="text-sky-400"/>} title="Total Komisi Final">
                    <DetailRow label="KOMISI ADV" value={displayMetrics.komisiAdv} />
                    <DetailRow label="KOMISI MP" value={displayMetrics.komisiMP} />
                    <DetailRow label="(-) Cashbon & Denda DRA" value={displayMetrics.cashbonDendaDra} />
                    <div className="border-t border-slate-700 my-1"></div>
                    <div className="p-3 bg-emerald-600/30 rounded-md flex justify-between items-center font-bold text-lg text-emerald-300 border-t-2 border-emerald-500 !mt-2">
                      <span>KOMISI ADV FIX (Total)</span>
                      <span>{formatCurrency(displayMetrics.komisiAdvFix)}</span>
                    </div>
                </Section>

                <Section icon={<CheckCircle size={20} className="text-sky-400"/>} title="Validasi Perhitungan">
                    <DetailRow label="Komisi Terhitung:" value={displayMetrics.komisiAdv} />
                    <DetailRow label="Komisi Aktual:" value={displayMetrics.komisiAdv} />
                    <div className="flex justify-between items-center py-2 px-3">
                       <span className="text-slate-300">Status:</span>
                       <div className="flex items-center gap-2 font-semibold text-green-400">
                          <CheckCircle size={16} />
                          <span>Sesuai</span>
                       </div>
                    </div>
                </Section>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionSummaryModal;