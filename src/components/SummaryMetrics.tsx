import React from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Layers, 
  ArrowRight, 
  Sparkles,
  Wallet
} from 'lucide-react';
import { TransactionReceipt } from '../types';
import { formatCurrency } from '../utils/financialCalculations';

interface SummaryMetricsProps {
  receipts: TransactionReceipt[];
  onOpenSettlement: (type: 'PRINCIPAL' | 'COMMISSION' | 'BOTH') => void;
}

export const SummaryMetrics: React.FC<SummaryMetricsProps> = ({ receipts, onOpenSettlement }) => {
  // Principal calculations
  const totalPrincipalUGX = receipts.reduce((sum, r) => sum + r.principalAmount, 0);
  const totalPrincipalDZD = receipts.reduce((sum, r) => sum + r.targetAmount, 0);

  const settledPrincipalUGX = receipts.reduce((sum, r) => sum + r.settledPrincipalUGX, 0);
  const settledPrincipalDZD = receipts.reduce((sum, r) => sum + r.settledPrincipalDZD, 0);

  const outstandingPrincipalUGX = Math.max(0, totalPrincipalUGX - settledPrincipalUGX);
  const outstandingPrincipalDZD = Math.max(0, totalPrincipalDZD - settledPrincipalDZD);

  const outstandingReceiptsCount = receipts.filter(
    (r) => r.principalSettlementStatus === 'OUTSTANDING' || r.principalSettlementStatus === 'PARTIALLY_SETTLED'
  ).length;

  // Commission calculations (Earned Commissions handled separately)
  const totalCommissionUGX = receipts.reduce((sum, r) => sum + r.totalEarnedCommissionUGX, 0);
  const totalCommissionDZD = receipts.reduce((sum, r) => sum + r.totalEarnedCommissionDZD, 0);

  const settledCommissionUGX = receipts.reduce((sum, r) => sum + r.settledCommissionUGX, 0);
  const settledCommissionDZD = receipts.reduce((sum, r) => sum + r.settledCommissionDZD, 0);

  const outstandingCommissionUGX = Math.max(0, totalCommissionUGX - settledCommissionUGX);
  const outstandingCommissionDZD = Math.max(0, totalCommissionDZD - settledCommissionDZD);

  const unsettledCommissionCount = receipts.filter((r) => r.commissionSettlementStatus === 'UNSETTLED').length;

  const settledPercentage = totalPrincipalUGX > 0 
    ? Math.round((settledPrincipalUGX / totalPrincipalUGX) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Outstanding Settled Amount (Principal) */}
      <div className="bg-white rounded-xl border border-amber-200/80 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Outstanding Principal
            </span>
            <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              {outstandingReceiptsCount} Pending
            </span>
          </div>

          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatCurrency(outstandingPrincipalUGX, 'UGX')}
          </div>
          <div className="text-xs font-medium text-amber-700/90 mt-0.5 flex items-center gap-1.5">
            <span>≈ {formatCurrency(outstandingPrincipalDZD, 'DZD')}</span>
            <span className="text-slate-400">•</span>
            <span>$ {((outstandingPrincipalUGX) / 3600).toFixed(2)} USD</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Awaiting Laposte payout</span>
          <button
            onClick={() => onOpenSettlement('PRINCIPAL')}
            disabled={outstandingPrincipalUGX <= 0}
            type="button"
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer"
          >
            Settle Principal <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 2. Cumulative Settled Amount (Principal) */}
      <div className="bg-white rounded-xl border border-emerald-200/80 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Cumulative Settled
            </span>
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              {settledPercentage}% Settled
            </span>
          </div>

          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatCurrency(settledPrincipalUGX, 'UGX')}
          </div>
          <div className="text-xs font-medium text-emerald-700 mt-0.5">
            Disbursed: {formatCurrency(settledPrincipalDZD, 'DZD')}
          </div>

          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, settledPercentage)}%` }}
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Cleared via banking channels</span>
          <span className="font-semibold text-slate-700">Audit Verified</span>
        </div>
      </div>

      {/* 3. Earned Commissions (Separated Tracking & Settlement) */}
      <div className="bg-white rounded-xl border border-purple-200/80 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none" />
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Earned Commissions
            </span>
            <span className="text-[11px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
              {unsettledCommissionCount} Unswept
            </span>
          </div>

          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatCurrency(totalCommissionUGX, 'UGX')}
          </div>
          <div className="text-xs font-medium text-purple-700 mt-0.5 flex items-center gap-2">
            <span>Pending Sweep: {formatCurrency(outstandingCommissionUGX, 'UGX')}</span>
          </div>

          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Swept: {formatCurrency(settledCommissionUGX, 'UGX')}</span>
            <span className="text-slate-400">({formatCurrency(totalCommissionDZD, 'DZD')})</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Bank-fee share only</span>
          <button
            onClick={() => onOpenSettlement('COMMISSION')}
            disabled={outstandingCommissionUGX <= 0}
            type="button"
            className="inline-flex items-center gap-1 text-xs font-bold text-purple-800 hover:text-purple-950 hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer"
          >
            Settle Commissions <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 4. Total Volume & Historical Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-bl-full pointer-events-none" />
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-slate-500" />
              Receipts Turnover
            </span>
            <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
              {receipts.length} Total Reports
            </span>
          </div>

          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatCurrency(totalPrincipalUGX, 'UGX')}
          </div>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <span>Gross Volume: {formatCurrency(totalPrincipalDZD, 'DZD')}</span>
          </div>

          <div className="mt-2 text-[11px] text-slate-500">
            Avg ticket: {receipts.length ? formatCurrency(Math.round(totalPrincipalUGX / receipts.length), 'UGX') : '0 UGX'}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Wallet className="h-3 w-3 text-slate-400" />
            Fastspot Multi-Currency
          </span>
          <span className="font-mono text-[10px] text-slate-600">Console Ledger</span>
        </div>
      </div>
    </div>
  );
};
