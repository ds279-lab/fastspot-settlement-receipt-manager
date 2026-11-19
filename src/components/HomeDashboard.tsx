import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Clock3, FileText } from 'lucide-react';
import { SummaryMetrics } from './SummaryMetrics';
import { TransactionReceipt, TransferType } from '../types';
import { formatCurrency } from '../utils/financialCalculations';

interface HomeDashboardProps {
  receipts: TransactionReceipt[];
  onOpenSettlement: (type: 'PRINCIPAL' | 'COMMISSION' | 'BOTH') => void;
  onStartTransaction: (type: TransferType) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  receipts,
  onOpenSettlement,
  onStartTransaction,
}) => {
  const latestReceipt = [...receipts].sort(
    (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
  )[0];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 text-white shadow-md">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
              Fastspot Transfers
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Transact with Fastspot</h2>
            <p className="mt-1 text-sm text-slate-300">
              Start a transaction and add its PDF receipt to the ledger.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onStartTransaction('SEND')}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-400 cursor-pointer"
            >
              <ArrowUpRight className="h-4 w-4" />
              Send Money
            </button>
            <button
              type="button"
              onClick={() => onStartTransaction('RECEIVE')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20 cursor-pointer"
            >
              <ArrowDownLeft className="h-4 w-4" />
              Receive Money
            </button>
          </div>
        </div>
      </section>

      <SummaryMetrics receipts={receipts} onOpenSettlement={onOpenSettlement} />

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <Clock3 className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Last Performed Transaction</h3>
        </div>

        {latestReceipt ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Client / Sender</p>
              <p className="mt-1 font-bold text-slate-900">{latestReceipt.clientName}</p>
              <p className="mt-0.5 font-mono text-xs text-slate-500">{latestReceipt.referenceCode}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Transaction</p>
              <p className="mt-1 font-bold text-slate-900">
                {latestReceipt.transferType === 'RECEIVE' ? 'Receive Money' : 'Send Money'}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{latestReceipt.transactionDate}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Amounts</p>
              <p className="mt-1 font-bold text-slate-900">
                {formatCurrency(latestReceipt.sourceAmount, latestReceipt.sourceCurrency)}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Cash in: {formatCurrency(latestReceipt.targetAmount, latestReceipt.targetCurrency)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ledger status</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                Principal: {latestReceipt.principalSettlementStatus.replace('_', ' ')}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Commission: {latestReceipt.commissionSettlementStatus}
              </p>
            </div>
            <div className="flex items-center gap-2 border-t border-slate-100 pt-3 sm:col-span-2 lg:col-span-4">
              <FileText className="h-4 w-4 shrink-0 text-slate-400" />
              <p className="truncate text-xs text-slate-500" title={latestReceipt.filename}>
                Receipt: {latestReceipt.filename}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <FileText className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">No transactions recorded yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Start a send or receive transaction to add the first receipt.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
