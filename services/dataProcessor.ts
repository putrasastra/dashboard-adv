import { SalesData, CalculatedMetrics, OperationalCostItem, UserBasedFinancials, OtherExpenseItem, NetProfitContributionItem, ProductHPP } from '../types';

const BM_COMMISSION_RATE = 0.10; // 10%
const SPV_ADV_COMMISSION_RATE = 0.03; // 3%
const SPV_CRM_COMMISSION_RATE = 0.02; // 2%

// Centralized static HPP database for calculations
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

export const parseProducts = (remark: string | undefined): { name: string; qty: number }[] => {
  if (!remark) return [];
  
  const products: { name: string; qty: number }[] = [];
  // Handles cases like "1 Produk Alpha, Produk Beta"
  const parts = remark.split(',').map(p => p.trim());

  for (const part of parts) {
    const match = part.match(/(\d+)\s*(.*)/);
    if (match) {
      const qty = parseInt(match[1], 10);
      const name = match[2].trim();
      if (name) products.push({ name, qty });
    } else {
      // If no quantity is specified, assume 1
      if (part) products.push({ name: part, qty: 1 });
    }
  }
  return products;
};


export const processSalesData = (
  data: SalesData[], 
  opCosts: OperationalCostItem[], 
  cashbackData: UserBasedFinancials,
  komisiMPData: UserBasedFinancials,
  otherExpensesData: OtherExpenseItem[],
  netProfitContributionData: NetProfitContributionItem[],
  selectedUser: string | null,
  crmNetProfitForCommission: number,
  netProfitToAdv: number,
  netProfitToAdvPerUser: { [userName: string]: number }
): CalculatedMetrics => {
  const metrics: CalculatedMetrics = {
    grossOmset: 0, lossOmsetReturn: 0, onDelivery: 0, prosesClaim: 0, prosesRetur: 0, omsetPaidDelivered: 0,
    cashback: 0, hpp: 0, ongkir: 0, feeCod: 0, iklan: 0, gajiPokokCS: 0, bonusCS: 0, bonusCrm: 0,
    biayaRetur: 0, biayaKerusakanRetur: 0, netProfitByAdvertiser: 0,
    netProfit: 0, komisiAdv: 0, komisiAdvPercentage: 0, gapokAdv: 0, gapokCrm: 0, komisiAdvFix: 0, komisiMP: 0, 
    cashbonDendaDra: 0, totalKomisi: 0, otherExpenses: 0, netProfitContribution: 0, totalTransactions: 0, totalReturned: 0,
    productBreakdown: {},
    hppBreakdown: {},
    deliveredCount: 0, onDeliveryCount: 0, claimProcessCount: 0, returnProcessCount: 0, returnFinishedCount: 0, totalAmountItem: 0, omsetAfterDiscount: 0,
    komisiBM: 0, komisiSpvAdv: 0, komisiSpvCrm: 0, totalKomisiLeader: 0,
  };

  const isAllUsers = !selectedUser || selectedUser === 'Semua Pengguna';
  
  const filteredData = isAllUsers 
    ? data 
    : data.filter(row => row['Seller name'] === selectedUser);
    
  metrics.totalTransactions = filteredData.length;

  const hppMap = new Map<string, number>();
  for (const item of STATIC_HPP_DATA) {
    if (item['Nama Produk'] && typeof item['HPP'] === 'number') {
      hppMap.set(item['Nama Produk'].trim(), item['HPP']);
    }
  }

  for (const row of filteredData) {
    const rowValue = row['Grand total'] || 0;
    
    metrics.grossOmset += rowValue;
    
    const status = (typeof row['Status pengiriman'] === 'string') 
        ? row['Status pengiriman'].trim().toLowerCase() 
        : '';
    
    switch (status) {
      case 'paid':
      case 'delivered':
        metrics.omsetPaidDelivered += rowValue;
        metrics.deliveredCount++;
        metrics.ongkir += row['Delivery fee'] || 0;
        metrics.feeCod += row['COD fee'] || 0;
        metrics.totalAmountItem += row['Amount item'] || 0;
        metrics.omsetAfterDiscount += (row['Amount item'] || 0) - (row['Delivery fee'] || 0) - (row['COD fee'] || 0);
        
        const products = parseProducts(row['Remark']);

        // Populate product quantity breakdown first, regardless of HPP source
        for (const product of products) {
          metrics.productBreakdown[product.name] = (metrics.productBreakdown[product.name] || 0) + product.qty;
        }

        // NEW HPP LOGIC: Prioritize Hpp distributor from file if it's a positive number.
        const hppFromFile = row['Hpp distributor'] || 0;
        if (hppFromFile > 0) {
          metrics.hpp += hppFromFile;
          // For breakdown reporting, attribute HPP to the first product if only one, otherwise use the remark.
          if (products.length === 1) {
            metrics.hppBreakdown[products[0].name] = (metrics.hppBreakdown[products[0].name] || 0) + hppFromFile;
          } else if (row['Remark']) {
            metrics.hppBreakdown[row['Remark']] = (metrics.hppBreakdown[row['Remark']] || 0) + hppFromFile;
          }
        } else {
          // If HPP from file is 0, calculate from Remark and the HPP database.
          let calculatedHpp = 0;
          for (const product of products) {
            const productHppValue = hppMap.get(product.name) || 0;
            const totalHppForProduct = productHppValue * product.qty;
            calculatedHpp += totalHppForProduct;
            metrics.hppBreakdown[product.name] = (metrics.hppBreakdown[product.name] || 0) + totalHppForProduct;
          }
          metrics.hpp += calculatedHpp;
        }
        break;
      case 'retur terkunci':
      case 'retur selesai':
        metrics.lossOmsetReturn += rowValue;
        metrics.returnFinishedCount++;
        metrics.biayaRetur += row['Biaya ongkir retur'] || 0;
        if (status === 'retur selesai') {
          metrics.biayaKerusakanRetur += row['Biaya kerusakan'] || 0;
        }
        break;
      case 'on delivery':
        metrics.onDelivery += rowValue;
        metrics.onDeliveryCount++;
        break;
      case 'proses claim paket rusak / hilang':
        metrics.prosesClaim += rowValue;
        metrics.claimProcessCount++;
        break;
      case 'proses retur':
        metrics.prosesRetur += rowValue;
        metrics.returnProcessCount++;
        break;
      default:
        break;
    }
  }

  // Aggregate operational costs
  const relevantOpCosts = isAllUsers
    // For a single user, get their specific costs PLUS general costs (user is undefined)
    ? opCosts
    : opCosts.filter(cost => cost.user === selectedUser || !cost.user);
  
  for (const cost of relevantOpCosts) {
    switch (cost.name) {
      case 'IKLAN':
        metrics.iklan += cost.amount;
        break;
      case 'GAJI POKOK CS':
        metrics.gajiPokokCS += cost.amount;
        break;
      case 'BONUS CS':
        metrics.bonusCS += cost.amount;
        break;
      case 'GAPOK ADV':
        metrics.gapokAdv += cost.amount;
        break;
      case 'CASHBON & DENDA DRA':
        metrics.cashbonDendaDra += cost.amount;
        break;
      case 'BONUS CRM':
        metrics.bonusCrm += cost.amount;
        break;
    }
  }
  
  metrics.otherExpenses = otherExpensesData.reduce((sum, item) => {
    const keterangan = item.Keterangan?.trim().toUpperCase();
    const amount = item.Amount || 0;

    if (keterangan === 'GAPOK CRM') {
        metrics.gapokCrm += amount;
        return sum; // Fix: Do not add to otherExpenses
    } else if (keterangan.startsWith('BONUS PIC CRM')) {
        metrics.komisiSpvCrm += amount;
        return sum; // Exclude from otherExpenses to prevent double counting
    }
    
    return sum + amount;
  }, 0);
  
  metrics.netProfitContribution = netProfitContributionData.reduce((sum, item) => sum + item.Amount, 0);

  if (isAllUsers) {
    metrics.cashback = Object.values(cashbackData).reduce((sum, val) => sum + val, 0);
    metrics.komisiMP = Object.entries(komisiMPData).reduce((sum, [user, val]) => {
        if (user === 'FLUX MEDIA') {
            return sum;
        }
        return sum + val;
    }, 0);
  } else {
    metrics.cashback = cashbackData[selectedUser] || 0;
    metrics.komisiMP = selectedUser === 'FLUX MEDIA' ? 0 : (komisiMPData[selectedUser] || 0);
  }
  
  // NEW FORMULA FOR NET PROFIT BY ADVERTISER
  metrics.netProfitByAdvertiser = (metrics.omsetPaidDelivered + metrics.cashback) 
    - (metrics.hpp + metrics.ongkir + metrics.feeCod + metrics.iklan + metrics.gajiPokokCS + metrics.bonusCS + metrics.biayaRetur + metrics.biayaKerusakanRetur);

  const calculateCommissionForNetOmset = (netOmset: number): number => {
    const netOmsetMil = netOmset / 1_000_000;
    if (netOmsetMil < 70) return 0.16;
    if (netOmsetMil < 80) return 0.17;
    if (netOmsetMil < 90) return 0.18;
    if (netOmsetMil < 100) return 0.19;
    return 0.20;
  };

  if (isAllUsers) {
    const users = [...new Set(data.map(row => row['Seller name']).filter(Boolean) as string[])];
    let totalKomisiAdv = 0;
    let totalBaseKomisi = 0;

    for (const user of users) {
      const userMetrics = processSalesData(data, opCosts, cashbackData, komisiMPData, otherExpensesData, netProfitContributionData, user, crmNetProfitForCommission, netProfitToAdvPerUser[user] || 0, netProfitToAdvPerUser);
      
      const userNetOmset = userMetrics.omsetPaidDelivered - userMetrics.ongkir - userMetrics.feeCod;
      const userNetProfitAdv = userMetrics.netProfitByAdvertiser;
      const userNetProfitFromCrm = netProfitToAdvPerUser[user] || 0;
      const userBaseKomisi = userNetProfitAdv + userNetProfitFromCrm;
      
      let userKomisiAdv;
      if (userBaseKomisi < 0) {
        userKomisiAdv = userBaseKomisi;
      } else {
        const commissionRate = calculateCommissionForNetOmset(userNetOmset);
        userKomisiAdv = userBaseKomisi * commissionRate;
      }

      // Zero out commission for FLUX MEDIA
      if (user === 'FLUX MEDIA') {
        userKomisiAdv = 0;
      }

      totalKomisiAdv += userKomisiAdv;
      totalBaseKomisi += userBaseKomisi;
    }
    
    metrics.komisiAdv = totalKomisiAdv;
    metrics.komisiAdvPercentage = totalBaseKomisi > 0 ? totalKomisiAdv / totalBaseKomisi : 0;
  } else {
    const netOmset = metrics.omsetPaidDelivered - metrics.ongkir - metrics.feeCod;
    const baseKomisi = metrics.netProfitByAdvertiser + netProfitToAdv;
    
    if (baseKomisi < 0) {
      metrics.komisiAdv = baseKomisi;
      metrics.komisiAdvPercentage = 0; // The rate isn't applicable.
    } else {
      const commissionRate = calculateCommissionForNetOmset(netOmset);
      metrics.komisiAdv = baseKomisi * commissionRate;
      metrics.komisiAdvPercentage = commissionRate;
    }

    // Zero out commission for FLUX MEDIA
    if (selectedUser === 'FLUX MEDIA') {
        metrics.komisiAdv = 0;
    }
  }
  
  metrics.komisiAdvFix = metrics.komisiAdv + metrics.komisiMP - metrics.cashbonDendaDra;
  metrics.totalKomisi = metrics.komisiAdvFix;
  
  // This is the value displayed in the "GROSS PROFIT" card in the UI.
  // Formula: net profit by advertiser + net profit contribution + total net profit crm - komisi adv fix
  const grossProfitForCommission = metrics.netProfitByAdvertiser + metrics.netProfitContribution + crmNetProfitForCommission - metrics.komisiAdvFix;

  // New calculation for BM and SPV ADV commissions based on the "GROSS PROFIT" card value.
  metrics.komisiBM = grossProfitForCommission * BM_COMMISSION_RATE;
  metrics.komisiSpvAdv = grossProfitForCommission * SPV_ADV_COMMISSION_RATE;

  // SPV CRM commission is sourced from 'Expanse Lainnya' and is not changed.
  metrics.totalKomisiLeader = metrics.komisiBM + metrics.komisiSpvAdv + metrics.komisiSpvCrm;

  // The final Net Profit is the GROSS PROFIT card value minus the total leader commissions.
  metrics.netProfit = grossProfitForCommission - metrics.totalKomisiLeader;

  return metrics;
};