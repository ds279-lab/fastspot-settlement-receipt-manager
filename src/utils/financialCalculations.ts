import { CommissionSettings, TransactionReceipt } from '../types';

export const DEFAULT_SETTINGS: CommissionSettings = {
  operatorShareOfFeePercent: 50, // 50% of bank fee is operator commission share
  defaultUgxUsdRate: 3600.0,
  defaultSaleRate: 238.0,
  defaultPurchaseRate: 236.0,
  defaultFeePercent: 8.0,
};

export interface ManualSendFeeTier {
  id: string;
  minAmountUGX: number;
  maxAmountUGX: number | null;
  feeUGX: number;
}

export const DEFAULT_MANUAL_SEND_FEE_TIERS: ManualSendFeeTier[] = [
  { id: 'tier-1', minAmountUGX: 500, maxAmountUGX: 2500, feeUGX: 100 },
  { id: 'tier-2', minAmountUGX: 2501, maxAmountUGX: 5000, feeUGX: 220 },
  { id: 'tier-3', minAmountUGX: 5001, maxAmountUGX: 15000, feeUGX: 360 },
  { id: 'tier-4', minAmountUGX: 15001, maxAmountUGX: 30000, feeUGX: 460 },
  { id: 'tier-5', minAmountUGX: 30001, maxAmountUGX: 60000, feeUGX: 720 },
  { id: 'tier-6', minAmountUGX: 60001, maxAmountUGX: 125000, feeUGX: 1000 },
  { id: 'tier-7', minAmountUGX: 125001, maxAmountUGX: 250000, feeUGX: 1450 },
  { id: 'tier-8', minAmountUGX: 250001, maxAmountUGX: 500000, feeUGX: 2000 },
  { id: 'tier-9', minAmountUGX: 500001, maxAmountUGX: 1000000, feeUGX: 3200 },
  { id: 'tier-10', minAmountUGX: 1000001, maxAmountUGX: null, feeUGX: 5000 },
];

export function getManualSendFeeTier(
  amountUGX: number,
  tiers: ManualSendFeeTier[] = DEFAULT_MANUAL_SEND_FEE_TIERS
) {
  return [...tiers]
    .sort((a, b) => a.minAmountUGX - b.minAmountUGX)
    .find(
      (tier) =>
        amountUGX >= tier.minAmountUGX &&
        (tier.maxAmountUGX === null || amountUGX <= tier.maxAmountUGX)
    );
}

export function calculateManualSendPayout(
  amountUGX: number,
  tiers: ManualSendFeeTier[] = DEFAULT_MANUAL_SEND_FEE_TIERS,
  settings: Pick<CommissionSettings, 'defaultUgxUsdRate' | 'defaultSaleRate' | 'defaultFeePercent'> = DEFAULT_SETTINGS
) {
  const safeAmountUGX = Number.isFinite(amountUGX) ? Math.max(0, amountUGX) : 0;
  const feeTier = getManualSendFeeTier(safeAmountUGX, tiers);
  const sendingFeeUGX = safeAmountUGX > 0 ? feeTier?.feeUGX ?? 0 : 0;
  const totalUGX = safeAmountUGX + sendingFeeUGX;
  const usdAmount = totalUGX / settings.defaultUgxUsdRate;
  const daBase = usdAmount * settings.defaultSaleRate;
  const cashInDA = daBase * (1 + settings.defaultFeePercent / 100);

  return {
    amountUGX: safeAmountUGX,
    feeTier,
    sendingFeeUGX,
    totalUGX,
    ugxPerUsd: settings.defaultUgxUsdRate,
    daPerUsd: settings.defaultSaleRate,
    bankFeePercent: settings.defaultFeePercent,
    usdAmount,
    daBase,
    cashInDA,
  };
}

export function calculateCommission(
  principalAmount: number,
  fxUgxUsdRate: number = 3600,
  usdSaleRate: number = 238,
  usdPurchaseRate: number = 236,
  bankFeePercent: number = 8,
  operatorShareOfFeePercent: number = 50
) {
  const safeRate = fxUgxUsdRate > 0 ? fxUgxUsdRate : 3600;
  const safeSale = usdSaleRate > 0 ? usdSaleRate : 238;
  const safePurchase = usdPurchaseRate > 0 ? usdPurchaseRate : 236;

  const usdEquivalent = principalAmount / safeRate;
  const spreadMarginPerUsd = Math.max(0, safeSale - safePurchase);
  const spreadGainDZD = spreadMarginPerUsd * usdEquivalent;
  const spreadGainUGX = (spreadGainDZD / safeSale) * safeRate;

  const bankFeeAmountUGX = principalAmount * (bankFeePercent / 100);
  const feeCommissionShareUGX = bankFeeAmountUGX * (operatorShareOfFeePercent / 100);
  const feeCommissionShareDZD = (feeCommissionShareUGX / safeRate) * safeSale;

  const totalEarnedCommissionUGX = feeCommissionShareUGX;
  const totalEarnedCommissionDZD = feeCommissionShareDZD;

  return {
    usdEquivalent,
    spreadMarginPerUsd,
    spreadGainDZD,
    spreadGainUGX,
    bankFeeAmountUGX,
    feeCommissionShareUGX,
    feeCommissionShareDZD,
    totalEarnedCommissionUGX,
    totalEarnedCommissionDZD,
  };
}

export function normalizeReceiptCommissionToBankFeeOnly<T extends {
  bankFeeAmountUGX: number;
  feeCommissionShareUGX: number;
  fxUgxUsdRate: number;
  usdSaleRate: number;
}>(receipt: T): T & { totalEarnedCommissionUGX: number; totalEarnedCommissionDZD: number } {
  const feeCommissionShareUGX = Number.isFinite(receipt.feeCommissionShareUGX)
    ? receipt.feeCommissionShareUGX
    : receipt.bankFeeAmountUGX * (DEFAULT_SETTINGS.operatorShareOfFeePercent / 100);
  const safeRate = receipt.fxUgxUsdRate > 0 ? receipt.fxUgxUsdRate : DEFAULT_SETTINGS.defaultUgxUsdRate;
  const safeSale = receipt.usdSaleRate > 0 ? receipt.usdSaleRate : DEFAULT_SETTINGS.defaultSaleRate;
  const feeCommissionShareDZD = (feeCommissionShareUGX / safeRate) * safeSale;

  return {
    ...receipt,
    feeCommissionShareUGX,
    totalEarnedCommissionUGX: feeCommissionShareUGX,
    totalEarnedCommissionDZD: feeCommissionShareDZD,
  };
}

export function formatCurrency(amount: number, currency: string = 'UGX', decimals?: number): string {
  const isWhole = currency === 'UGX';
  const dec = decimals !== undefined ? decimals : isWhole ? 0 : 2;

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(amount || 0);

  if (currency === 'DZD' || currency === 'DA') {
    return `${formatted} DA`;
  }
  if (currency === 'UGX') {
    return `${formatted} UGX`;
  }
  if (currency === 'USD') {
    return `$${formatted}`;
  }
  if (currency === 'EUR') {
    return `€${formatted}`;
  }
  return `${formatted} ${currency}`;
}

export function createReceiptFromExtracted(
  data: any,
  filename: string,
  pdfUrl?: string,
  settings: CommissionSettings = DEFAULT_SETTINGS
): TransactionReceipt {
  const sourceAmount = Number(data.sourceAmount) || 150000;
  const principalAmount = Number(data.principalAmount) || sourceAmount;
  const targetAmount = Number(data.targetAmount) || 10813.53;
  const fxUgxUsdRate = Number(data.fxUgxUsdRate) || settings.defaultUgxUsdRate;
  const usdSaleRate = Number(data.usdSaleRate) || settings.defaultSaleRate;
  const usdPurchaseRate = Number(data.usdPurchaseRate) || settings.defaultPurchaseRate;
  const bankFeePercent = Number(data.bankFeePercent) ?? settings.defaultFeePercent;

  const calcs = calculateCommission(
    principalAmount,
    fxUgxUsdRate,
    usdSaleRate,
    usdPurchaseRate,
    bankFeePercent,
    settings.operatorShareOfFeePercent
  );

  const id = `TX-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();

  return {
    id,
    referenceCode: data.referenceCode || `FS-${Math.floor(100000 + Math.random() * 900000)}`,
    filename: filename || 'receipt.pdf',
    clientName: data.clientName || 'Customer',
    operator: data.operator || 'Fastspot Transfers',
    accountNumber: data.accountNumber || 'Laposte - 007 99999 0043606637 24',
    transferType: (data.transferType as any) || 'SEND',
    sourceCurrency: data.sourceCurrency || 'UGX',
    sourceAmount,
    principalAmount,
    targetCurrency: data.targetCurrency || 'DZD',
    targetAmount,
    fxUgxUsdRate,
    usdSaleRate,
    usdPurchaseRate,
    bankFeePercent,
    bankFeeAmountUGX: calcs.bankFeeAmountUGX,
    spreadMarginPerUsd: calcs.spreadMarginPerUsd,
    usdEquivalent: calcs.usdEquivalent,
    spreadGainDZD: calcs.spreadGainDZD,
    spreadGainUGX: calcs.spreadGainUGX,
    feeCommissionShareUGX: calcs.feeCommissionShareUGX,
    totalEarnedCommissionUGX: calcs.totalEarnedCommissionUGX,
    totalEarnedCommissionDZD: calcs.totalEarnedCommissionDZD,
    transactionDate: data.transactionDate || new Date().toLocaleString(),
    uploadDate: new Date().toISOString(),
    notes: data.notes || '',
    pdfUrl: pdfUrl || '',
    principalSettlementStatus: 'OUTSTANDING',
    settledPrincipalUGX: 0,
    settledPrincipalDZD: 0,
    commissionSettlementStatus: 'UNSETTLED',
    settledCommissionUGX: 0,
    settledCommissionDZD: 0,
    settlementBatchIds: [],
  };
}
