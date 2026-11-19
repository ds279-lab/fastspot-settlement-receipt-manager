import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  Calendar, 
  Building2, 
  ArrowRight, 
  ChevronDown, 
  ChevronRight,
  Printer,
  Sparkles,
  Download
} from 'lucide-react';
import { SettlementRecord, TransactionReceipt } from '../types';
import { formatCurrency } from '../utils/financialCalculations';

interface SettlementHistoryLedgerProps {
  settlements: SettlementRecord[];
  receipts: TransactionReceipt[];
  onOpenSettlement: () => void;
}

export const SettlementHistoryLedger: React.FC<SettlementHistoryLedgerProps> = ({
  settlements,
  receipts,
  onOpenSettlement,
}) => {
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedBatchId((prev) => (prev === id ? null : id));
  };

  const getReceiptsForBatch = (receiptIds: string[]) => {
    return receipts.filter((r) => receiptIds.includes(r.id));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
            Settlement Audit Ledger
          </h2>
          <p className="text-xs text-slate-500">
            Historical audit log of cleared principal batches and operator commission sweeps
          </p>
        </div>

        <button
          onClick={onOpenSettlement}
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>New Settlement Batch</span>
        </button>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 w-8"></th>
              <th className="py-3 px-3">Batch Number / Ref</th>
              <th className="py-3 px-3">Date &amp; Time</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3 text-center">Receipts</th>
              <th className="py-3 px-3 text-right">Principal Cleared</th>
              <th className="py-3 px-3 text-right">Commission Swept</th>
              <th className="py-3 px-3">Payout Channel</th>
              <th className="py-3 px-3">Operator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {settlements.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">No settlement batches recorded yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Execute a settlement to clear outstanding principal or sweep earned commissions.
                  </p>
                </td>
              </tr>
            ) : (
              settlements.map((s) => {
                const isExpanded = expandedBatchId === s.id;
                const batchReceipts = getReceiptsForBatch(s.receiptIds);

                return (
                  <React.Fragment key={s.id}>
                    <tr
                      onClick={() => toggleExpand(s.id)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-slate-400">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-indigo-600" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        <div>{s.batchNumber}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{s.payoutReference}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {new Date(s.createdAt).toLocaleDateString()}
                        <div className="text-[10px] text-slate-400">
                          {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {s.settlementType === 'PRINCIPAL' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            PRINCIPAL
                          </span>
                        ) : s.settlementType === 'COMMISSION' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            COMMISSION
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            FULL BATCH
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        {s.receiptCount}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {s.totalPrincipalUGX > 0 ? (
                          <>
                            <div>{formatCurrency(s.totalPrincipalUGX, 'UGX')}</div>
                            <div className="text-[10px] text-emerald-700">
                              {formatCurrency(s.totalPrincipalDZD, 'DZD')}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-purple-700">
                        {s.totalCommissionUGX > 0 ? (
                          <>
                            <div>{formatCurrency(s.totalCommissionUGX, 'UGX')}</div>
                            <div className="text-[10px] text-purple-900/60">
                              {formatCurrency(s.totalCommissionDZD, 'DZD')}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        <div className="font-semibold">{s.payoutMethod}</div>
                        <div className="text-[10px] text-slate-400">{s.notes}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {s.settledBy}
                      </td>
                    </tr>

                    {/* Expandable row showing bundled receipts */}
                    {isExpanded && (
                      <tr className="bg-slate-50 border-y border-slate-200">
                        <td colSpan={9} className="p-4 pl-12">
                          <div className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <span>Receipts Bundled in Batch {s.batchNumber}:</span>
                            <span className="text-slate-400 font-normal">({batchReceipts.length} transactions)</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {batchReceipts.map((r) => (
                              <div
                                key={r.id}
                                className="bg-white border border-slate-200 p-2.5 rounded-lg text-[11px] shadow-2xs"
                              >
                                <div className="flex justify-between font-bold text-slate-800">
                                  <span>{r.clientName}</span>
                                  <span className="font-mono text-indigo-600">{r.referenceCode}</span>
                                </div>
                                <div className="flex justify-between text-slate-600 mt-1">
                                  <span>Principal: {formatCurrency(r.principalAmount, 'UGX')}</span>
                                  <span className="text-emerald-700 font-semibold">{formatCurrency(r.targetAmount, 'DZD')}</span>
                                </div>
                                <div className="text-[10px] text-purple-700 mt-0.5">
                                  Commission: {formatCurrency(r.totalEarnedCommissionUGX, 'UGX')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
