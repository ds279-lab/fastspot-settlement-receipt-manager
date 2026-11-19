import React, { useState } from 'react';
import { 
  X, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Building2, 
  ArrowRight,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { SettlementRecord, SettlementType, TransactionReceipt } from '../types';
import { formatCurrency } from '../utils/financialCalculations';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipts: TransactionReceipt[];
  selectedReceiptIds: string[];
  initialType?: SettlementType;
  onExecuteSettlement: (record: SettlementRecord, updatedReceiptIds: string[], type: SettlementType) => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  isOpen,
  onClose,
  receipts,
  selectedReceiptIds,
  initialType = 'PRINCIPAL',
  onExecuteSettlement,
}) => {
  const [settlementType, setSettlementType] = useState<SettlementType>(initialType);
  const [payoutMethod, setPayoutMethod] = useState('Laposte Account Clearing');
  const [payoutReference, setPayoutReference] = useState(
    `LP-REF-${Date.now().toString().slice(-6)}`
  );
  const [settledBy, setSettledBy] = useState('Operator (Console Desk)');
  const [notes, setNotes] = useState('');
  const [completedRecord, setCompletedRecord] = useState<SettlementRecord | null>(null);

  if (!isOpen) return null;

  // Receipts to include
  const targetReceipts = selectedReceiptIds.length > 0
    ? receipts.filter((r) => selectedReceiptIds.includes(r.id))
    : receipts.filter((r) => {
        if (settlementType === 'PRINCIPAL') {
          return r.principalSettlementStatus !== 'SETTLED';
        }
        if (settlementType === 'COMMISSION') {
          return r.commissionSettlementStatus !== 'SETTLED';
        }
        return r.principalSettlementStatus !== 'SETTLED' || r.commissionSettlementStatus !== 'SETTLED';
      });

  // Calculate cumulative sums to settle
  const totalPrincipalToSettleUGX = targetReceipts.reduce((sum, r) => {
    if (settlementType === 'COMMISSION') return sum;
    const remaining = Math.max(0, r.principalAmount - r.settledPrincipalUGX);
    return sum + remaining;
  }, 0);

  const totalPrincipalToSettleDZD = targetReceipts.reduce((sum, r) => {
    if (settlementType === 'COMMISSION') return sum;
    const remaining = Math.max(0, r.targetAmount - r.settledPrincipalDZD);
    return sum + remaining;
  }, 0);

  const totalCommissionToSettleUGX = targetReceipts.reduce((sum, r) => {
    if (settlementType === 'PRINCIPAL') return sum;
    const remaining = Math.max(0, r.totalEarnedCommissionUGX - r.settledCommissionUGX);
    return sum + remaining;
  }, 0);

  const totalCommissionToSettleDZD = targetReceipts.reduce((sum, r) => {
    if (settlementType === 'PRINCIPAL') return sum;
    const remaining = Math.max(0, r.totalEarnedCommissionDZD - r.settledCommissionDZD);
    return sum + remaining;
  }, 0);

  const handleConfirm = () => {
    if (targetReceipts.length === 0) return;

    const batchId = `STL-${Date.now().toString().slice(-8)}`;
    const batchNumber = `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const newRecord: SettlementRecord = {
      id: batchId,
      batchNumber,
      createdAt: new Date().toISOString(),
      settlementType,
      receiptIds: targetReceipts.map((r) => r.id),
      receiptCount: targetReceipts.length,
      totalPrincipalUGX: totalPrincipalToSettleUGX,
      totalPrincipalDZD: totalPrincipalToSettleDZD,
      totalCommissionUGX: totalCommissionToSettleUGX,
      totalCommissionDZD: totalCommissionToSettleDZD,
      payoutMethod,
      payoutReference,
      settledBy,
      notes: notes || `Settled ${targetReceipts.length} transactions via ${payoutMethod}`,
    };

    onExecuteSettlement(newRecord, targetReceipts.map((r) => r.id), settlementType);
    setCompletedRecord(newRecord);
  };

  const handleClose = () => {
    setCompletedRecord(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {completedRecord ? 'Settlement Voucher & Receipt' : 'Execute Cumulative Settlement'}
              </h2>
              <p className="text-xs text-slate-500">
                Settle cumulative principal sums and earned commissions separately or combined
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {completedRecord ? (
            /* Voucher View */
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">
                    Settlement Batch Cleared Successfully!
                  </h3>
                  <p className="text-xs text-emerald-800">
                    Batch Ref: <strong className="font-mono">{completedRecord.batchNumber}</strong>
                  </p>
                </div>
              </div>

              {/* Printable Voucher Box */}
              <div className="border border-slate-300 rounded-xl p-5 bg-slate-50/50 font-mono text-xs space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-900">FASTSPOT TRANSFERS SETTLEMENT VOUCHER</span>
                  <span className="text-[10px] text-slate-500">{new Date(completedRecord.createdAt).toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">SETTLEMENT TYPE</span>
                    <strong className="text-slate-900 font-bold">{completedRecord.settlementType}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">PAYOUT CHANNEL</span>
                    <strong className="text-slate-900 font-bold">{completedRecord.payoutMethod}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">CLEARING REF</span>
                    <strong className="text-slate-900 font-bold">{completedRecord.payoutReference}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">OPERATOR</span>
                    <strong className="text-slate-900 font-bold">{completedRecord.settledBy}</strong>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 space-y-1">
                  <div className="flex justify-between">
                    <span>Receipts Included:</span>
                    <span className="font-bold">{completedRecord.receiptCount} receipts</span>
                  </div>
                  {completedRecord.settlementType !== 'COMMISSION' && (
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Total Principal Settled:</span>
                      <span>{formatCurrency(completedRecord.totalPrincipalUGX, 'UGX')} ({formatCurrency(completedRecord.totalPrincipalDZD, 'DZD')})</span>
                    </div>
                  )}
                  {completedRecord.settlementType !== 'PRINCIPAL' && (
                    <div className="flex justify-between font-bold text-purple-700">
                      <span>Earned Commission Swept:</span>
                      <span>{formatCurrency(completedRecord.totalCommissionUGX, 'UGX')} ({formatCurrency(completedRecord.totalCommissionDZD, 'DZD')})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Settlement Form */
            <div className="space-y-4">
              {/* Settlement Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Select Settlement Type (Separated Workflows)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettlementType('PRINCIPAL')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      settlementType === 'PRINCIPAL'
                        ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400/40 text-amber-950'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">Principal Only</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Disburse sender funds to Laposte/clearing
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettlementType('COMMISSION')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      settlementType === 'COMMISSION'
                        ? 'border-purple-500 bg-purple-50/70 ring-2 ring-purple-400/40 text-purple-950'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">Commission Only</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Sweep earned fees &amp; FX margin to operator
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettlementType('BOTH')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      settlementType === 'BOTH'
                        ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-400/40 text-emerald-950'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">Full Settlement</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Clear both principal &amp; commission together
                    </div>
                  </button>
                </div>
              </div>

              {/* Cumulative Sum Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                  <span>Batch Scope:</span>
                  <span className="font-bold text-slate-900">
                    {targetReceipts.length} transaction receipt(s) included
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  {settlementType !== 'COMMISSION' && (
                    <div>
                      <div className="text-[11px] text-slate-500 uppercase font-semibold">
                        Principal to Settle
                      </div>
                      <div className="text-lg font-black text-slate-900">
                        {formatCurrency(totalPrincipalToSettleUGX, 'UGX')}
                      </div>
                      <div className="text-xs font-medium text-emerald-700">
                        {formatCurrency(totalPrincipalToSettleDZD, 'DZD')}
                      </div>
                    </div>
                  )}

                  {settlementType !== 'PRINCIPAL' && (
                    <div>
                      <div className="text-[11px] text-slate-500 uppercase font-semibold">
                        Earned Commission to Sweep
                      </div>
                      <div className="text-lg font-black text-purple-700">
                        {formatCurrency(totalCommissionToSettleUGX, 'UGX')}
                      </div>
                      <div className="text-xs font-medium text-purple-900/60">
                        {formatCurrency(totalCommissionToSettleDZD, 'DZD')}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Settlement Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Payout / Clearing Channel
                  </label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Laposte Account Clearing">Laposte Account Clearing (Algeria)</option>
                    <option value="Commercial Bank Wire">Commercial Bank Wire</option>
                    <option value="MTN Mobile Money Uganda">MTN Mobile Money Uganda</option>
                    <option value="Airtel Money Uganda">Airtel Money Uganda</option>
                    <option value="Operator Treasury Sweep">Operator Treasury Sweep</option>
                    <option value="Cash Over-the-Counter">Cash Over-the-Counter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Clearing Reference / Wire Code
                  </label>
                  <input
                    type="text"
                    value={payoutReference}
                    onChange={(e) => setPayoutReference(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Authorized Operator
                  </label>
                  <input
                    type="text"
                    value={settledBy}
                    onChange={(e) => setSettledBy(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Settlement Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. End of day reconciliation batch"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {completedRecord ? (
            <div className="w-full flex justify-between">
              <button
                onClick={() => window.print()}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Voucher</span>
              </button>
              <button
                onClick={handleClose}
                type="button"
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={handleClose}
                type="button"
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={targetReceipts.length === 0}
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm &amp; Settle Batch ({targetReceipts.length})</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
