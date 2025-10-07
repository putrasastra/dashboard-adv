// Fix: Corrected the import for React hooks.
import React, { useState, useMemo, useEffect } from 'react';
import { processSalesData, parseProducts } from './services/dataProcessor';
// Fix: Import AllSheetData from the shared types file.
import { CalculatedMetrics, SalesData, AllSheetData, ProductHPP } from './types';
import FileUpload from './components/FileUpload';
import MetricCard from './components/MetricCard';
import MetricListItem from './components/MetricListItem';
import HelpModal from './components/HelpModal';
import HppBreakdownModal from './components/HppBreakdownModal';
import ProductBreakdownCard from './components/ProductBreakdownCard';
import CommissionBreakdownCard from './components/CommissionBreakdownCard';
import CommissionSummaryModal from './components/CommissionSummaryModal';
import DeliveryDetailsTable from './components/DeliveryDetailsTable';
import { HelpCircle, Upload, X, List, LayoutGrid, TrendingUp, TrendingDown, DollarSign, Briefcase, Package, ShieldCheck, ChevronsRight, User, PiggyBank, FileText, Gift, Anchor, BarChart2, AlertTriangle, UserCheck, AlertOctagon, Boxes, Users, ChevronDown, Calculator } from 'lucide-react';

type ViewMode = 'list' | 'card';
// Fix: Removed the local AllSheetData type definition as it is now imported from types.ts.

// Centralized static HPP database for calculations in this component
const STATIC_HPP_DATA: ProductHPP[] = [
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
];

const App: React.FC = () => {
  const [allSheetData, setAllSheetData] = useState<AllSheetData | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [userList, setUserList] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isHppModalOpen, setIsHppModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isLeaderCommissionExpanded, setIsLeaderCommissionExpanded] = useState(false);

  const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value);

  const handleDataLoaded = (data: AllSheetData, uploadedFileName: string) => {
    const allSheets = Object.keys(data);
    
    // Get all standard sales data sheets (not the operational/config sheets)
    const salesDataSheets = allSheets.filter(name => ![
        "Biaya Operasional", "CASHBACK", "Komisi MP", "Expanse Lainnya", 
        "Net Profit Contribution", "Data Penjualan CRM", "HPP Produk"
    ].includes(name));
    
    let displaySheets: string[] = [...salesDataSheets];
    const hasDataPenjualan = allSheets.includes('Data Penjualan');
    const hasCrmSheet = allSheets.includes('Data Penjualan CRM');

    // If 'Data Penjualan' exists, rename it to 'ADV' for the menu
    if (hasDataPenjualan) {
        const dpIndex = displaySheets.indexOf('Data Penjualan');
        if (dpIndex !== -1) {
            displaySheets[dpIndex] = 'ADV';
        }
    }

    if (hasCrmSheet) {
        displaySheets.push('CRM');
    }

    setAllSheetData(data);
    setSheetNames(displaySheets);
    
    // Set initial active sheet to 'ADV' if available
    const initialSheet = displaySheets.includes('ADV') ? 'ADV' : displaySheets[0] || '';
    setActiveSheet(initialSheet);
    
    setFileName(uploadedFileName);
    
    // Extract unique users from the primary 'Data Penjualan' sheet for consistency.
    const advSheetKey = 'Data Penjualan';
    const salesDataForUsers = data[advSheetKey]?.salesData || data[Object.keys(data)[0]]?.salesData || [];
    const users = [...new Set(salesDataForUsers.map(item => item['Seller name']).filter(Boolean) as string[])];
    
    // Always default to the first user and never show "Semua Pengguna"
    setUserList(users);
    setSelectedUser(users[0] || '');
    
    setError(null);
    setIsUploadModalOpen(false);
  };

  const actualSheetName = useMemo(() => {
    if (activeSheet === 'CRM') {
      return 'Data Penjualan CRM';
    }
    if (activeSheet === 'ADV') {
      return 'Data Penjualan';
    }
    return activeSheet;
  }, [activeSheet]);


  // Calculate CRM metrics separately to display them in other views
  const crmMetrics = useMemo<CalculatedMetrics | null>(() => {
    const crmSheetName = 'Data Penjualan CRM';
    if (!allSheetData || !allSheetData[crmSheetName]) return null;
    const { salesData, opCosts, cashbackData, komisiMPData, otherExpensesData, netProfitContributionData } = allSheetData[crmSheetName];
    // For CRM calculation, external CRM profit and ADV profit from CRM are 0
    return processSalesData(salesData, opCosts, cashbackData, komisiMPData, otherExpensesData, netProfitContributionData, selectedUser, 0, 0, {});
  }, [allSheetData, selectedUser]);
  
  // Specific calculation for NET PROFIT CRM card, excluding gapok
  const netProfitCrmCardValue = crmMetrics ? (
      crmMetrics.omsetPaidDelivered -
      crmMetrics.hpp -
      crmMetrics.feeCod -
      crmMetrics.ongkir -
      crmMetrics.biayaRetur -
      crmMetrics.biayaKerusakanRetur -
      crmMetrics.bonusCrm
  ) : 0;

  // ADV profit is 80% of NET PROFIT CRM card value
  const netProfitToAdv = netProfitCrmCardValue * 0.8;
  
  const netProfitToAdvPerUser = useMemo<{ [userName: string]: number }>(() => {
    const result: { [userName: string]: number } = {};
    const crmSheetName = 'Data Penjualan CRM';
    if (!allSheetData || !allSheetData[crmSheetName]) return {};

    const crmSheet = allSheetData[crmSheetName];
    
    const crmUsers = [...new Set(crmSheet.salesData.map(item => item['Seller name']).filter(Boolean) as string[])];

    for (const user of crmUsers) {
      const userCrmMetrics = processSalesData(
        crmSheet.salesData, crmSheet.opCosts, crmSheet.cashbackData, crmSheet.komisiMPData, 
        crmSheet.otherExpensesData, crmSheet.netProfitContributionData,
        user, 0, 0, {}
      );

      const userNetProfitCrmCardValue = userCrmMetrics ? (
          userCrmMetrics.omsetPaidDelivered - userCrmMetrics.hpp - userCrmMetrics.feeCod - 
          userCrmMetrics.ongkir - userCrmMetrics.biayaRetur - userCrmMetrics.biayaKerusakanRetur - 
          userCrmMetrics.bonusCrm
      ) : 0;
      
      result[user] = userNetProfitCrmCardValue * 0.8;
    }
    
    return result;
  }, [allSheetData]);


  const metrics = useMemo<CalculatedMetrics | null>(() => {
    // If we're in CRM view, metrics are just crmMetrics
    if (activeSheet === 'CRM') return crmMetrics;
    
    // Otherwise, calculate for the current sales sheet
    if (!allSheetData || !actualSheetName || !allSheetData[actualSheetName]) return null;
    const { salesData, opCosts, cashbackData, komisiMPData, otherExpensesData, netProfitContributionData } = allSheetData[actualSheetName];
    
    // Pass the calculated CRM net profit for SPV CRM commission and ADV commission calculations
    return processSalesData(salesData, opCosts, cashbackData, komisiMPData, otherExpensesData, netProfitContributionData, selectedUser, netProfitCrmCardValue, netProfitToAdv, netProfitToAdvPerUser);
  }, [allSheetData, actualSheetName, selectedUser, crmMetrics, netProfitCrmCardValue, netProfitToAdv, activeSheet, netProfitToAdvPerUser]);
  
  const processedSalesData = useMemo<SalesData[]>(() => {
    if (!allSheetData || !actualSheetName || !allSheetData[actualSheetName]) return [];

    const { salesData } = allSheetData[actualSheetName];

    const hppMap = new Map<string, number>();
    for (const item of STATIC_HPP_DATA) {
      if (item['Nama Produk'] && typeof item['HPP'] === 'number') {
        hppMap.set(item['Nama Produk'].trim(), item['HPP']);
      }
    }

    const baseData = selectedUser && selectedUser !== 'Semua Pengguna'
      ? salesData.filter(row => row['Seller name'] === selectedUser)
      : salesData;

    return baseData.map(row => {
      // If Hpp distributor from the file is valid and > 0, use it directly.
      if (row['Hpp distributor'] && row['Hpp distributor'] > 0) {
        return row;
      }

      // Otherwise, calculate the HPP from the Remark field and HPP database.
      const products = parseProducts(row['Remark']);
      let calculatedHpp = 0;
      if (products.length > 0) {
        calculatedHpp = products.reduce((total, product) => {
          const productHppValue = hppMap.get(product.name) || 0;
          return total + (productHppValue * product.qty);
        }, 0);
      }
      
      return {
        ...row,
        'Hpp distributor': calculatedHpp,
      };
    });
  }, [allSheetData, actualSheetName, selectedUser]);
  
  const isCrmView = activeSheet === 'CRM';

  const crmUserCount = useMemo<number>(() => {
    const crmSheetName = 'Data Penjualan CRM';
    if (!allSheetData || !allSheetData[crmSheetName]) return 0;
    
    const crmSalesData = allSheetData[crmSheetName].salesData;
    // Make user detection more robust by trimming whitespace.
    const users = new Set(crmSalesData.map(item => item['Seller name']?.trim()).filter(Boolean));
    return users.size;
  }, [allSheetData]);

  // CUAN profit is the remainder after ADV share, GAPOK CRM, and other operational expenses are deducted.
  const netProfitToCuan = netProfitCrmCardValue - netProfitToAdv - (crmMetrics ? (crmMetrics.gapokCrm + crmMetrics.otherExpenses) : 0);

  // Component for the new leader commission breakdown
  const LeaderCommissionBreakdown = ({ total, bm, spvAdv, spvCrm }: { total: number, bm: number, spvAdv: number, spvCrm: number }) => {
    if (total === 0 && bm === 0 && spvAdv === 0 && spvCrm === 0) return <p className="mt-2 text-slate-400">Tidak ada komisi untuk ditampilkan.</p>;
  
    const items = [
      { label: 'BM', value: bm, color: 'bg-sky-500', rate: '10% Gross Profit' },
      { label: 'SPV ADV', value: spvAdv, color: 'bg-indigo-500', rate: '3% Gross Profit' },
      { label: 'SPV CRM', value: spvCrm, color: 'bg-teal-500', rate: 'Bonus dari Biaya Lainnya' },
    ];
    
    // Use total of individual commissions for percentage calculation to handle potential rounding differences
    const actualTotal = bm + spvAdv + spvCrm;
  
    return (
      <div className="mt-2 space-y-2 animate-fade-in">
        {items.map(item => (
          <div key={item.label}>
            <div className="flex justify-between items-center mb-1 text-sm">
              <span className="font-medium text-slate-300">
                {item.label} <span className="text-xs text-slate-400">({item.rate})</span>
              </span>
              <span className="font-semibold text-slate-200">{formatCurrency(item.value)}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className={`${item.color} h-1.5 rounded-full transition-all duration-500`}
                style={{ width: actualTotal > 0 ? `${(item.value / actualTotal) * 100}%` : '0%' }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };


  const metricList = metrics ? (isCrmView ? [
    // CRM View Metrics
    { section: "Ringkasan CRM", items: [
      { key: "grossOmset", title: "GROSS OMSET", value: formatCurrency(metrics.grossOmset), icon: <TrendingUp />, desc: `Total pendapatan kotor dari ${formatNumber(metrics.totalTransactions)} transaksi CRM.`, color: "bg-sky-500/20 text-sky-400" },
      { key: "omsetAfterDiscount", title: "NET OMSET", value: formatCurrency(metrics.omsetPaidDelivered - metrics.ongkir - metrics.feeCod), icon: <Boxes />, desc: "Net Sales - ONGKIR - FEE COD.", color: "bg-purple-500/20 text-purple-400" },
      { key: "netProfitCrm", title: "NET PROFIT CRM", value: formatCurrency(netProfitCrmCardValue), icon: <PiggyBank />, desc: "TOTAL LABA BERSIH CRM", color: "bg-teal-500/20 text-teal-400" },
      { key: "netProfitToAdv", title: "NET PROFIT TO ADV 80%", value: formatCurrency(netProfitToAdv), icon: <UserCheck />, desc: "80% DARI NET PROFIT CRM", color: "bg-indigo-500/20 text-indigo-400" },
      // Conditionally render the CUAN card only when "Semua Pengguna" is selected
      ...(selectedUser === 'Semua Pengguna' ? [{
          key: "netProfitToCuan", 
          title: "TOTAL NET PROFIT CRM CUAN", 
          value: formatCurrency(netProfitToCuan), 
          icon: <Briefcase />, 
          desc: "Profit CRM - Bagian ADV - GAPOK CRM - Biaya Operasional Lainnya.", 
          color: "bg-green-500/20 text-green-400"
      }] : []),
    ]},
    { section: "STATUS OMSET CRM", items: [
      { key: "omsetPaidDelivered", title: "NET SALES", value: formatCurrency(metrics.omsetPaidDelivered), icon: <ShieldCheck />, desc: `Total ${formatNumber(metrics.deliveredCount)} transaksi berhasil terkirim.`, color: "bg-emerald-500/20 text-emerald-400" },
      { key: "onDelivery", title: "ON DELIVERY", value: formatCurrency(metrics.onDelivery), icon: <Package />, desc: `${formatNumber(metrics.onDeliveryCount)} transaksi sedang dalam perjalanan.`, color: "bg-cyan-500/20 text-cyan-400" },
      { key: "prosesClaim", title: "PROSES KLAIM", value: formatCurrency(metrics.prosesClaim), icon: <ChevronsRight />, desc: `${formatNumber(metrics.claimProcessCount)} transaksi dalam proses klaim.`, color: "bg-orange-500/20 text-orange-400" },
      { key: "prosesRetur", title: "PROSES RETUR", value: formatCurrency(metrics.prosesRetur), icon: <ChevronsRight />, desc: `${formatNumber(metrics.returnProcessCount)} transaksi dalam proses retur.`, color: "bg-orange-500/20 text-orange-400" },
      { key: "lossOmsetReturn", title: "RETUR SELESAI DAN TERKUNCI", value: formatCurrency(metrics.lossOmsetReturn), icon: <TrendingDown />, desc: `Total ${formatNumber(metrics.returnFinishedCount)} transaksi selesai diretur.`, color: "bg-red-500/20 text-red-400" },
    ]},
    { section: "Rincian Biaya", items: [
        { key: "hpp", title: "HPP", value: formatCurrency(metrics.hpp), icon: <BarChart2 />, desc: "Total Harga Pokok Penjualan dari barang terkirim.", color: "bg-slate-500/20 text-slate-400" },
        { key: "ongkir", title: "ONGKIR", value: formatCurrency(metrics.ongkir), icon: <BarChart2 />, desc: "Total biaya ongkos kirim dari barang terkirim.", color: "bg-slate-500/20 text-slate-400" },
        { key: "feeCod", title: "FEE COD", value: formatCurrency(metrics.feeCod), icon: <BarChart2 />, desc: "Total biaya penanganan COD dari barang terkirim.", color: "bg-slate-500/20 text-slate-400" },
        { key: "biayaOngkirRetur", title: "BIAYA ONGKIR RETUR", value: formatCurrency(metrics.biayaRetur), icon: <Anchor />, desc: "Total biaya ongkos kirim untuk barang retur.", color: "bg-yellow-500/20 text-yellow-400" },
        { key: "biayaKerusakanRetur", title: "BIAYA KERUSAKAN RETUR", value: formatCurrency(metrics.biayaKerusakanRetur), icon: <Anchor />, desc: "Total biaya dari kerusakan barang yang diretur.", color: "bg-yellow-500/20 text-yellow-400" },
        { key: "bonusCrm", title: "BONUS CRM", value: formatCurrency(metrics.bonusCrm), icon: <Gift />, desc: "Total bonus yang dialokasikan untuk CRM.", color: "bg-fuchsia-500/20 text-fuchsia-400" },
        ...((selectedUser === 'Semua Pengguna' && crmUserCount > 1) ? [{ 
            key: "gapokCrm", 
            title: "GAPOK CRM", 
            value: formatCurrency(metrics.gapokCrm), 
            icon: <UserCheck />, 
            desc: "Total gaji pokok untuk tim CRM.", 
            color: "bg-fuchsia-500/20 text-fuchsia-400" 
        }] : []),
    ]}
  ] : (() => {
    // Default Sales View Metrics
    const defaultSections = [
    { section: "Ringkasan Utama", items: [
      { key: "grossOmset", title: "GROSS OMSET", value: formatCurrency(metrics.grossOmset), icon: <TrendingUp />, desc: `Total pendapatan dari semua status (${formatNumber(metrics.totalTransactions)} transaksi).`, color: "bg-sky-500/20 text-sky-400" },
      {
        key: "grossProfitCustom",
        title: "GROSS PROFIT",
        value: formatCurrency(metrics.netProfitByAdvertiser + metrics.netProfitContribution + netProfitCrmCardValue - metrics.komisiAdvFix),
        icon: <Briefcase />,
        desc: "net profit by advertiser + net profit contribution + total net profit crm - komisi adv fix",
        color: "bg-purple-500/20 text-purple-400"
      },
      { 
        key: "netProfit", 
        title: "NET PROFIT", 
        value: formatCurrency(metrics.netProfit),
        icon: <DollarSign />, 
        desc: "GROSS PROFIT - TOTAL KOMISI LEADER.", 
        color: "bg-green-500/20 text-green-400" 
      },
    ]},
    { section: "Status Omset", items: [
        { key: "omsetPaidDelivered", title: "NET SALES", value: formatCurrency(metrics.omsetPaidDelivered), icon: <ShieldCheck />, desc: `Pendapatan dari penjualan terkirim/paid (${formatNumber(metrics.deliveredCount)} transaksi).`, color: "bg-emerald-500/20 text-emerald-400" },
        { key: "onDelivery", title: "ON DELIVERY", value: formatCurrency(metrics.onDelivery), icon: <Package />, desc: `Nilai produk dalam pengiriman (${formatNumber(metrics.onDeliveryCount)} transaksi).`, color: "bg-cyan-500/20 text-cyan-400" },
        { key: "prosesClaim", title: "OMSET PROSES KLAIM", value: formatCurrency(metrics.prosesClaim), icon: <ChevronsRight />, desc: `Nilai barang dalam proses klaim (${formatNumber(metrics.claimProcessCount)} transaksi).`, color: "bg-orange-500/20 text-orange-400" },
        { key: "prosesRetur", title: "OMSET PROSES RETUR", value: formatCurrency(metrics.prosesRetur), icon: <ChevronsRight />, desc: `Nilai barang dalam proses retur (${formatNumber(metrics.returnProcessCount)} transaksi).`, color: "bg-orange-500/20 text-orange-400" },
        { key: "lossOmsetReturn", title: "LOSS OMSET RETURN", value: formatCurrency(metrics.lossOmsetReturn), icon: <TrendingDown />, desc: `Total kerugian dari ${formatNumber(metrics.returnFinishedCount)} barang retur selesai/terkunci.`, color: "bg-red-500/20 text-red-400" },
    ]},
    { section: "Rincian Biaya", items: [
        { key: "hpp", title: "HPP", value: formatCurrency(metrics.hpp), icon: <BarChart2 />, desc: "Total Harga Pokok Penjualan dari barang terkirim.", color: "bg-slate-500/20 text-slate-400" },
        { key: "ongkir", title: "ONGKIR", value: formatCurrency(metrics.ongkir), icon: <BarChart2 />, desc: "Total biaya ongkos kirim dari barang terkirim.", color: "bg-slate-500/20 text-slate-400" },
        { key: "feeCod", title: "FEE COD", value: formatCurrency(metrics.feeCod), icon: <BarChart2 />, desc: "Total biaya penanganan COD dari barang terkirim.", color: "bg-slate-500/20 text-slate-400" },
        { key: "iklan", title: "IKLAN", value: formatCurrency(metrics.iklan), icon: <FileText />, desc: "Total biaya iklan dari sheet operasional.", color: "bg-rose-500/20 text-rose-400" },
        { key: "gajiPokokCS", title: "GAJI POKOK CS", value: formatCurrency(metrics.gajiPokokCS), icon: <Gift />, desc: "Total gaji pokok tim Customer Service.", color: "bg-fuchsia-500/20 text-fuchsia-400" },
        { key: "bonusCS", title: "BONUS CS", value: formatCurrency(metrics.bonusCS), icon: <Gift />, desc: "Total bonus untuk tim Customer Service.", color: "bg-fuchsia-500/20 text-fuchsia-400" },
        { key: "gapokAdv", title: "GAPOK ADV", value: formatCurrency(metrics.gapokAdv), icon: <UserCheck />, desc: "Total gaji pokok untuk tim Advertiser.", color: "bg-fuchsia-500/20 text-fuchsia-400" },
        { key: "cashbonDendaDra", title: "CASHBON & DENDA DRA", value: formatCurrency(metrics.cashbonDendaDra), icon: <AlertOctagon />, desc: "Total cashbon dan denda DRA dari sheet operasional.", color: "bg-rose-500/20 text-rose-400" },
        { key: "cashback", title: "CASHBACK", value: formatCurrency(metrics.cashback), icon: <BarChart2 />, desc: "Total cashback dari sheet 'CASHBACK' per pengguna.", color: "bg-yellow-500/20 text-yellow-400" },
        { key: "biayaRetur", title: "BIAYA RETUR", value: formatCurrency(metrics.biayaRetur), icon: <Anchor />, desc: "Total biaya ongkos kirim untuk barang retur.", color: "bg-yellow-500/20 text-yellow-400" },
        { key: "biayaKerusakanRetur", title: "BIAYA KERUSAKAN RETUR", value: formatCurrency(metrics.biayaKerusakanRetur), icon: <Anchor />, desc: "Total biaya dari kerusakan barang yang diretur.", color: "bg-yellow-500/20 text-yellow-400" },
    ]},
    { section: "Kalkulasi Profit & Komisi", items: [
        { key: "netProfitContribution", title: "NET PROFIT CONTRIBUTION", value: formatCurrency(metrics.netProfitContribution), icon: <PiggyBank />, desc: "Total pendapatan tambahan dari sheet 'Net Profit Contribution'.", color: "bg-teal-500/20 text-teal-400" },
        { key: "netProfitByAdvertiser", title: "NET PROFIT BY ADVERTISER", value: formatCurrency(metrics.netProfitByAdvertiser), icon: <User />, desc: "Laba bersih setelah dikurangi semua biaya operasional dan biaya retur.", color: "bg-indigo-500/20 text-indigo-400" },
        { 
          key: "komisiLeader", 
          title: (
            <div className="flex justify-between items-center w-full">
              <span>KOMISI LEADER</span>
              <ChevronDown size={18} className={`transition-transform duration-300 ${isLeaderCommissionExpanded ? 'rotate-180' : ''}`} />
            </div>
          ),
          value: <div className="text-2xl font-bold text-white">{formatCurrency(metrics.totalKomisiLeader)}</div>, 
          icon: <Users />, 
          desc: (
            <div>
              <p className="mb-2">Total komisi untuk BM, SPV ADV, dan SPV CRM.</p>
              {isLeaderCommissionExpanded && (
                // Fix: Correct property names from `metrics.spvAdv` and `metrics.spvCrm` to `metrics.komisiSpvAdv` and `metrics.komisiSpvCrm`.
                <LeaderCommissionBreakdown total={metrics.totalKomisiLeader} bm={metrics.komisiBM} spvAdv={metrics.komisiSpvAdv} spvCrm={metrics.komisiSpvCrm} />
              )}
            </div>
          ), 
          color: "bg-purple-500/20 text-purple-400" 
        },
        { 
          key: "komisiAdv", 
          title: "KOMISI ADV", 
          value: formatCurrency(metrics.komisiAdv), 
          icon: <User />, 
          desc: selectedUser === 'Semua Pengguna'
            ? `Total komisi dari semua pengguna, dihitung per-individu. Tingkat komisi efektif: ~${(metrics.komisiAdvPercentage * 100).toFixed(1)}%`
            : "Komisi berjenjang berdasarkan Net Omset dari penjualan dan profit CRM.",
          color: "bg-indigo-500/20 text-indigo-400" 
        },
        { key: "komisiMP", title: "KOMISI MP", value: formatCurrency(metrics.komisiMP), icon: <Briefcase />, desc: "Komisi MP dari sheet 'Komisi MP'.", color: "bg-amber-500/20 text-amber-400" },
        { key: "komisiAdvFix", title: "KOMISI ADV FIX", value: formatCurrency(metrics.komisiAdvFix), icon: <Briefcase />, desc: "KOMISI ADV + KOMISI MP - CASHBON & DENDA DRA.", color: "bg-amber-500/20 text-amber-400" },
        { key: "crmNetProfitToAdv", title: "NET PROFIT TO ADV 80% (CRM)", value: formatCurrency(netProfitToAdv), icon: <UserCheck />, desc: "Bagian laba bersih Advertiser dari data CRM.", color: "bg-indigo-500/20 text-indigo-400" },
        // Conditionally render the CUAN card only when "Semua Pengguna" is selected
        ...(selectedUser === 'Semua Pengguna' ? [{
            key: "crmNetProfitCuan", 
            title: "TOTAL NET PROFIT CRM CUAN", 
            value: formatCurrency(netProfitToCuan), 
            icon: <Briefcase />, 
            desc: "Profit bersih perusahaan dari CRM setelah dikurangi semua biaya terkait.", 
            color: "bg-green-500/20 text-green-400"
        }] : []),
    ]},
  ];
    
    if (activeSheet === 'ADV') {
      const netOmsetAdvValue = metrics.omsetPaidDelivered - metrics.ongkir - metrics.feeCod;

      const advSections = defaultSections.map(section => {
        if (section.section === "Ringkasan Utama") {
          const grossOmsetCard = section.items.find(i => i.key === 'grossOmset');
          const netOmsetCard = {
            key: "netOmsetRingkasan",
            title: "NET OMSET",
            value: formatCurrency(netOmsetAdvValue),
            icon: <DollarSign />,
            desc: "Net Sales - ONGKIR - FEE COD.",
            color: "bg-green-500/20 text-green-400"
          };
          return { ...section, items: [grossOmsetCard, netOmsetCard].filter(Boolean) as any[] };
        }
        
        if (section.section === "Rincian Biaya") {
          return { ...section, items: section.items.filter(item => item.key !== 'gapokAdv') };
        }
        
        if (section.section === "Kalkulasi Profit & Komisi") {
          const items = section.items.filter(item => !['komisiLeader', 'crmNetProfitCuan', 'netProfitContribution'].includes(item.key));
          
          const totalNetProfitCard = {
            key: "totalNetProfitAdvCrm",
            title: "Total Net Profit (ADV+CRM)",
            value: formatCurrency(metrics.netProfitByAdvertiser + netProfitToAdv),
            icon: <PiggyBank />,
            desc: "Net profit by advertiser + NET PROFIT TO ADV 80% (CRM)",
            color: "bg-teal-500/20 text-teal-400"
          };
          
          const insertionIndex = items.findIndex(item => item.key === 'netProfitByAdvertiser');
          
          if (insertionIndex !== -1) {
            items.splice(insertionIndex + 1, 0, totalNetProfitCard);
          } else {
            items.push(totalNetProfitCard);
          }
          
          return { ...section, items };
        }
        
        return section;
      });

      return advSections;
    }

    return defaultSections;

  })()) : [];


  return (
    <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8 font-sans">
      {isHelpModalOpen && <HelpModal activeSheet={activeSheet} onClose={() => setIsHelpModalOpen(false)} />}
      
      {metrics && allSheetData && (
        <HppBreakdownModal
          isOpen={isHppModalOpen}
          onClose={() => setIsHppModalOpen(false)}
          formatCurrency={formatCurrency}
        />
      )}
      
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={() => setIsUploadModalOpen(false)}>
            <div className="bg-slate-900/80 border border-slate-700 rounded-2xl w-full max-w-3xl p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Unggah File Penjualan</h2>
                    <button onClick={() => setIsUploadModalOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full"><X size={20} /></button>
                </div>
                <FileUpload onDataLoaded={handleDataLoaded} isLoading={isLoading} setLoading={setIsLoading} setError={setError} />
            </div>
        </div>
      )}

      {metrics && activeSheet === 'ADV' && (
        <CommissionSummaryModal
          isOpen={isCommissionModalOpen}
          onClose={() => setIsCommissionModalOpen(false)}
          metrics={metrics}
          netProfitCrm={netProfitCrmCardValue}
          netProfitToAdv={netProfitToAdv}
          selectedUser={selectedUser}
          formatCurrency={formatCurrency}
          allSheetData={allSheetData}
          userList={userList}
          netProfitToAdvPerUser={netProfitToAdvPerUser}
        />
      )}

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Sales Dashboard</h1>
          <p className="text-slate-300 mt-1">Unggah data penjualan Anda untuk kalkulasi metrik instan.</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 bg-sky-500/20 text-sky-300 px-4 py-2 rounded-lg font-semibold hover:bg-sky-500/30 transition-all">
            <Upload size={16} />
            <span>{fileName ? "Unggah File Baru" : "Unggah Data"}</span>
          </button>
          <button onClick={() => setIsHelpModalOpen(true)} className="p-2.5 bg-slate-800/60 text-slate-300 rounded-lg hover:bg-slate-700/80 transition-all">
            <HelpCircle size={18} />
          </button>
        </div>
      </header>

      <main>
        {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg flex items-center gap-3 mb-6">
                <AlertTriangle size={20} />
                <div>
                    <p className="font-semibold">Terjadi Kesalahan</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        )}
        
        {!metrics && !isLoading && !error && (
             <div className="text-center py-20 opacity-60">
                <BarChart2 size={48} className="mx-auto text-slate-600" />
                <h2 className="mt-4 text-xl font-semibold text-slate-400">Dasbor Anda Menunggu Data</h2>
                <p className="text-slate-500">Klik tombol "Unggah Data" untuk memulai.</p>
            </div>
        )}

        {isLoading && (
            <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto"></div>
                <p className="mt-4 text-lg font-semibold text-white">Menganalisis data Anda...</p>
                <p className="text-slate-300">Ini mungkin akan memakan waktu sejenak.</p>
            </div>
        )}

        {metrics && (
          <div className="animate-fade-in space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <div className="flex items-center gap-3">
                    <span className="font-semibold">File:</span>
                    <span className="text-slate-300 bg-slate-700/50 px-3 py-1 rounded-md text-sm">{fileName}</span>
                </div>

                {/* Sheet & User Filters */}
                <div className="flex flex-wrap items-center gap-4">
                  {sheetNames.length > 0 && (
                      <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Menu:</span>
                           <select 
                                value={activeSheet} 
                                onChange={(e) => setActiveSheet(e.target.value)} 
                                className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                            >
                                {sheetNames.map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                      </div>
                  )}
                  {userList.length > 0 && (
                       <div className="flex items-center gap-2">
                            <User size={16} className="text-slate-400" />
                            <div className="relative">
                                <select 
                                    value={selectedUser} 
                                    onChange={(e) => setSelectedUser(e.target.value)} 
                                    className="appearance-none bg-slate-700/50 border border-slate-600 rounded-lg pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                >
                                    {userList.map(user => <option key={user} value={user}>{user}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                    <ChevronDown size={16} />
                                </div>
                            </div>
                       </div>
                  )}
                </div>

                {/* View Toggler and Commission Button */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsHppModalOpen(true)}
                        className="flex items-center gap-2 bg-slate-500/20 text-slate-300 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-slate-500/30 transition-all"
                    >
                        <BarChart2 size={16} />
                        <span>HPP</span>
                    </button>
                    {activeSheet === 'ADV' && (
                        <button
                            onClick={() => setIsCommissionModalOpen(true)}
                            className="flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-500/30 transition-all"
                        >
                            <Calculator size={16} />
                            <span>Ringkasan Komisi</span>
                        </button>
                    )}
                    <div className="flex items-center bg-slate-700/50 rounded-lg p-1">
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-600/50'}`}><List size={18} /></button>
                        <button onClick={() => setViewMode('card')} className={`p-2 rounded-md transition-colors ${viewMode === 'card' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-600/50'}`}><LayoutGrid size={18} /></button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {viewMode === 'list' ? (
                      <div className="space-y-6">
                        {metricList.map(section => (
                          <div key={section.section}>
                            <h3 className="text-lg font-semibold text-slate-300 mb-3">{section.section}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                              {section.items.map(item => (
                                <div key={item.key} onClick={item.key === 'komisiLeader' ? () => setIsLeaderCommissionExpanded(p => !p) : undefined} className={`${item.key === 'komisiLeader' ? 'cursor-pointer' : ''}`}>
                                  <MetricListItem title={item.title} value={item.value} icon={item.icon} description={item.desc} colorClass={item.color} />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                         {metricList.flatMap(s => s.items).map(item => (
                            <div key={item.key} onClick={item.key === 'komisiLeader' ? () => setIsLeaderCommissionExpanded(p => !p) : undefined} className={`${item.key === 'komisiLeader' ? 'cursor-pointer' : ''}`}>
                              <MetricCard title={item.title} value={item.value} icon={item.icon} description={item.desc} colorClass={item.color} />
                            </div>
                         ))}
                      </div>
                    )}
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <ProductBreakdownCard data={metrics.productBreakdown} />
                    {activeSheet === 'ADV' && metrics && (
                      <CommissionBreakdownCard
                        netProfitByAdvertiser={metrics.netProfitByAdvertiser}
                        netProfitToAdv={netProfitToAdv}
                        komisiAdvPercentage={metrics.komisiAdvPercentage}
                        komisiAdv={metrics.komisiAdv}
                        formatCurrency={formatCurrency}
                      />
                    )}
                </div>
            </div>
            
            <DeliveryDetailsTable data={processedSalesData} />

          </div>
        )}
      </main>
    </div>
  );
};

export default App;