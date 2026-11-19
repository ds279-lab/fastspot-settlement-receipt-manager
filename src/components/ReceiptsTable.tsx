import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Printer, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  FileText, 
  Sparkles,
  ArrowUpDown,
  CheckSquare,
  Square,
  ExternalLink
} from 'lucide-react';
import { TransactionReceipt } from '../types';
import { formatCurrency } from '../utils/financialCalculations';
import { printTable } from '../utils/printTable';

interface ReceiptsTableProps {
  receipts: TransactionReceipt[];
  selectedReceiptIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAllOutstanding: () => void;
  onClearSelection: () => void;
  onViewReceipt: (receipt: TransactionReceipt) => void;
  onSingleSettle: (receipt: TransactionReceipt) => void;
  onDeleteReceipt: (id: string) => void;
}

export const ReceiptsTable: React.FC<ReceiptsTableProps> = ({
  receipts,
  selectedReceiptIds,
  onToggleSelect,
  onSelectAllOutstanding,
  onClearSelection,
  onViewReceipt,
  onSingleSettle,
  onDeleteReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OUTSTANDING' | 'SETTLED' | 'COMM_UNSETTLED'>('ALL');

  // Filtered list
  const filteredReceipts = receipts.filter((r) => {
    const matchesSearch =
      r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referenceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.accountNumber.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'OUTSTANDING') {
      return r.principalSettlementStatus === 'OUTSTANDING' || r.principalSettlementStatus === 'PARTIALLY_SETTLED';
    }
    if (statusFilter === 'SETTLED') {
      return r.principalSettlementStatus === 'SETTLED';
    }
    if (statusFilter === 'COMM_UNSETTLED') {
      return r.commissionSettlementStatus === 'UNSETTLED';
    }
    return true;
  });

  const allFilteredSelected =
    filteredReceipts.length > 0 &&
    filteredReceipts.every((r) => selectedReceiptIds.includes(r.id));

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      onClearSelection();
    } else {
      filteredReceipts.forEach((r) => {
        if (!selectedReceiptIds.includes(r.id)) {
          onToggleSelect(r.id);
        }
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/60">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative min-w-[220px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search client, reference, account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filter Pill dropdown */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({receipts.length})
            </button>
            <button
              onClick={() => setStatusFilter('OUTSTANDING')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === 'OUTSTANDING' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Outstanding Principal
            </button>
            <button
              onClick={() => setStatusFilter('COMM_UNSETTLED')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === 'COMM_UNSETTLED' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unsettled Commission
            </button>
            <button
              onClick={() => setStatusFilter('SETTLED')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === 'SETTLED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Settled
            </button>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {selectedReceiptIds.length > 0 && (
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
              {selectedReceiptIds.length} selected
            </span>
          )}

          <button
            onClick={onSelectAllOutstanding}
            type="button"
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Select All Outstanding
          </button>

          <button
            onClick={() => printTable('receipts')}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto" data-print-table="receipts">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 w-10">
                <button
                  onClick={toggleSelectAllFiltered}
                  className="text-slate-500 hover:text-indigo-600 cursor-pointer"
                >
                  {allFilteredSelected ? (
                    <CheckSquare className="h-4 w-4 text-indigo-600" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3">Receipt / Ref</th>
              <th className="py-3 px-3">Client &amp; Account</th>
              <th className="py-3 px-3 text-right">Principal (UGX)</th>
              <th className="py-3 px-3 text-right">Cash In (DZD / DA)</th>
              <th className="py-3 px-3 text-center">Rates &amp; Fee</th>
              <th className="py-3 px-3 text-right">Earned Comm.</th>
              <th className="py-3 px-3 text-center">Principal Status</th>
              <th className="py-3 px-3 text-center">Commission Status</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredReceipts.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">No receipts found</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upload a transaction PDF report or adjust your search filter.
                  </p>
                </td>
              </tr>
            ) : (
              filteredReceipts.map((r) => {
                const isSelected = selectedReceiptIds.includes(r.id);
                const isMorisSample = r.id === 'TX-REF-MORIS-150000' || r.filename.includes('Moris');

                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onToggleSelect(r.id)}
                        className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-indigo-600" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>

                    {/* Receipt Ref / Filename */}
                    <td className="py-3 px-3 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-800 font-bold">{r.referenceCode}</span>
                        {isMorisSample && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-300">
                            Reference PDF
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[140px] flex items-center gap-1">
                        <FileText className="h-3 w-3 shrink-0 text-slate-400" />
                        <span title={r.filename}>{r.filename}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{r.transactionDate}</div>
                    </td>

                    {/* Client & Account */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{r.clientName}</div>
                      <div className="text-[11px] text-slate-500 font-mono truncate max-w-[190px]" title={r.accountNumber}>
                        {r.accountNumber}
                      </div>
                    </td>

                    {/* Principal Amount (UGX) */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-black text-slate-900 text-sm">
                        {formatCurrency(r.principalAmount, 'UGX')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ≈ ${r.usdEquivalent.toFixed(2)} USD
                      </div>
                    </td>

                    {/* Cash In (DZD) */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-black text-emerald-700 text-sm">
                        {formatCurrency(r.targetAmount, 'DZD')}
                      </div>
                      <div className="text-[10px] text-slate-400">Net payout</div>
                    </td>

                    {/* Rates & Fee */}
                    <td className="py-3 px-3 text-center">
                      <div className="text-[11px] text-slate-700 font-mono">
                        Sale: {r.usdSaleRate.toFixed(2)} DA
                      </div>
                      <div className="text-[10px] text-slate-400">
                        3,600 UGX/USD · +{r.bankFeePercent}% Fee
                      </div>
                    </td>

                    {/* Earned Commission */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-bold text-purple-700">
                        {formatCurrency(r.totalEarnedCommissionUGX, 'UGX')}
                      </div>
                      <div className="text-[10px] text-purple-900/60">
                        ({formatCurrency(r.totalEarnedCommissionDZD, 'DZD')})
                      </div>
                    </td>

                    {/* Principal Status */}
                    <td className="py-3 px-3 text-center">
                      {r.principalSettlementStatus === 'SETTLED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          SETTLED
                        </span>
                      ) : r.principalSettlementStatus === 'PARTIALLY_SETTLED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="h-3 w-3 text-amber-600" />
                          PARTIAL
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                          <AlertCircle className="h-3 w-3 text-amber-600" />
                          OUTSTANDING
                        </span>
                      )}
                    </td>

                    {/* Commission Status */}
                    <td className="py-3 px-3 text-center">
                      {r.commissionSettlementStatus === 'SETTLED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          SWEPT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-900 border border-purple-200">
                          <Clock className="h-3 w-3 text-purple-500" />
                          UNSETTLED
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewReceipt(r)}
                          type="button"
                          className="p-1.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="View Official Receipt Slip & Math"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => onSingleSettle(r)}
                          type="button"
                          className="p-1.5 rounded-md text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Settle this receipt"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => onDeleteReceipt(r.id)}
                          type="button"
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove receipt from ledger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer info */}
      <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between">
        <span>Showing {filteredReceipts.length} of {receipts.length} total receipts in history</span>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span> Outstanding Principal
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-purple-500"></span> Unsettled Commission
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Settled
          </span>
        </div>
      </div>
    </div>
  );
};
