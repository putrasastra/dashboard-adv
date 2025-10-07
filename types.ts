// Fix: Define the types used across the application.
export interface SalesData {
  'No'?: number;
  'Delivery number'?: string;
  'Status pengiriman'?: string;
  'Seller name'?: string;
  'Remark'?: string; // Product Name(s)
  'Amount item'?: number; // Quantity
  'Delivery fee'?: number;
  'COD fee'?: number;
  'Grand total'?: number;
  'Biaya kerusakan'?: number;
  'Biaya ongkir retur'?: number;
  'Hpp distributor'?: number;
}

export interface OperationalCostItem {
  name: string;
  amount: number;
  user?: string;
}

export interface UserBasedFinancials {
  [userName:string]: number;
}

export interface OtherExpenseItem {
  Keterangan: string;
  Amount: number;
}

export interface NetProfitContributionItem {
  Keterangan: string;
  Amount: number;
}

export interface ProductHPP {
  'Nama Produk': string;
  'HPP': number;
}

export interface CalculatedMetrics {
  grossOmset: number;
  lossOmsetReturn: number;
  onDelivery: number;
  prosesClaim: number;
  prosesRetur: number;
  omsetPaidDelivered: number;
  cashback: number; // Renamed from cashback15
  hpp: number;
  ongkir: number;
  feeCod: number;
  iklan: number;
  gajiPokokCS: number;
  bonusCS: number;
  bonusCrm: number;
  biayaRetur: number;
  biayaKerusakanRetur: number;
  netProfitByAdvertiser: number;
  netProfit: number;
  komisiAdv: number;
  komisiAdvPercentage: number;
  gapokAdv: number;
  gapokCrm: number;
  komisiAdvFix: number;
  komisiMP: number;
  cashbonDendaDra: number;
  totalKomisi: number;
  otherExpenses: number;
  netProfitContribution: number;
  totalTransactions: number;
  totalReturned: number;
  productBreakdown: { [key: string]: number };
  hppBreakdown: { [key: string]: number };
  // New transaction counters per status
  deliveredCount: number;
  onDeliveryCount: number;
  claimProcessCount: number;
  returnProcessCount: number;
  returnFinishedCount: number;
  omsetAfterDiscount: number;
  totalAmountItem: number;
  // New Leader Commissions
  komisiBM: number;
  komisiSpvAdv: number;
  komisiSpvCrm: number;
  totalKomisiLeader: number;
}

// Fix: Add AllSheetData type to be shared across components.
export type AllSheetData = {
  [sheetName: string]: {
    salesData: SalesData[];
    opCosts: OperationalCostItem[];
    cashbackData: UserBasedFinancials;
    komisiMPData: UserBasedFinancials;
    otherExpensesData: OtherExpenseItem[];
    netProfitContributionData: NetProfitContributionItem[];
  };
};