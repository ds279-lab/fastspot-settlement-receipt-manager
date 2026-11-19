export type TransferType = 'SEND' | 'RECEIVE';
export type SettlementStatus = 'OUTSTANDING' | 'PARTIALLY_SETTLED' | 'SETTLED';
export type CommissionSettlementStatus = 'UNSETTLED' | 'SETTLED';
export type SettlementType = 'PRINCIPAL' | 'COMMISSION' | 'BOTH';

export interface TransactionReceipt {
  id: string;
  referenceCode: string;
  filename: string;
  clientName: string;
  operator: string;
  accountNumber: string;
  transferType: TransferType;
  sourceCurrency: string;
  sourceAmount: number;
  principalAmount: number;
  targetCurrency: string;
  targetAmount: number;
  fxUgxUsdRate: number;
  usdSaleRate: number;
  usdPurchaseRate: number;
  bankFeePercent: number;
  bankFeeAmountUGX: number;
  spreadMarginPerUsd: number;
  usdEquivalent: number;
  spreadGainDZD: number;
  spreadGainUGX: number;
  feeCommissionShareUGX: number;
  totalEarnedCommissionUGX: number;
  totalEarnedCommissionDZD: number;
  transactionDate: string;
  uploadDate: string;
  notes?: string;
  pdfUrl?: string;
  // Settlement tracking
  principalSettlementStatus: SettlementStatus;
  settledPrincipalUGX: number;
  settledPrincipalDZD: number;
  commissionSettlementStatus: CommissionSettlementStatus;
  settledCommissionUGX: number;
  settledCommissionDZD: number;
  settlementBatchIds: string[];
}

export interface SettlementRecord {
  id: string;
  batchNumber: string;
  createdAt: string;
  settlementType: SettlementType;
  receiptIds: string[];
  receiptCount: number;
  totalPrincipalUGX: number;
  totalPrincipalDZD: number;
  totalCommissionUGX: number;
  totalCommissionDZD: number;
  payoutMethod: string;
  payoutReference: string;
  settledBy: string;
  notes?: string;
}

export interface CommissionSettings {
  operatorShareOfFeePercent: number; // e.g. 50% of the 8% bank fee
  defaultUgxUsdRate: number;
  defaultSaleRate: number;
  defaultPurchaseRate: number;
  defaultFeePercent: number;
}

export type LoanStatus = 'ACTIVE' | 'REPAID' | 'DEFAULTED';

export interface LoanPayment {
  id: string;
  amount: number;
  paidAt: string;
  notes?: string;
}

export interface LoanHistoryEntry {
  id: string;
  dateReceived: string;
  amount: number;
  currency: string;
  notes?: string;
  status: LoanStatus;
  createdAt: string;
}

export interface MoneyLentRecord {
  id: string;
  recipientName: string;
  dateReceived: string; // Date of receipt of money
  amount: number;
  currency: string; // 'UGX' | 'DZD' | 'USD' | 'EUR'
  idDocumentNumber: string; // Passport / Carte de séjour number
  email: string;
  status: LoanStatus;
  notes?: string;
  payments?: LoanPayment[];
  loanHistory?: LoanHistoryEntry[];
  createdAt: string;
}
