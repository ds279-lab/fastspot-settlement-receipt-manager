import React, { useState } from 'react';
import faviconUrl from '../../path/favicon.ico';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  ExternalLink,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { TransactionReceipt } from '../types';
import { formatCurrency } from '../utils/financialCalculations';

interface ReceiptDetailModalProps {
  receipt: TransactionReceipt | null;
  isOpen: boolean;
  onClose: () => void;
  onSettle: (receipt: TransactionReceipt) => void;
}

export const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({
  receipt,
  isOpen,
  onClose,
  onSettle,
}) => {
  const [viewTab, setViewTab] = useState<'replica' | 'audit' | 'pdf'>('replica');

  if (!isOpen || !receipt) return null;

  const handlePrintReceipt = () => {
    const previousTitle = document.title;
    const safeClientName = receipt.clientName
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
      .replace(/\s+/g, ' ')
      .slice(0, 100) || 'Client';
    const printTitle = ` ${safeClientName} - ${formatCurrency(receipt.sourceAmount, 'UGX')}`;
    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };

    document.title = printTitle;
    window.addEventListener('afterprint', restoreTitle, { once: true });
    try {
      window.print();
    } catch (error) {
      restoreTitle();
      throw error;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <img
                src={faviconUrl}
                alt="Fastspot Transfers"
                className="h-5 w-5 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Transaction Receipt: {receipt.clientName}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                  {receipt.referenceCode}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Uploaded report: {receipt.filename} · {receipt.transactionDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintReceipt}
              type="button"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab switch bar */}
        <div className="px-6 pt-2 border-b border-slate-200 bg-slate-50/50 flex gap-2">
          <button
            onClick={() => setViewTab('replica')}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              viewTab === 'replica'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Fastspot Official Slip Replica
          </button>
          <button
            onClick={() => setViewTab('audit')}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              viewTab === 'audit'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Commission &amp; Settlement Audit
          </button>
          {receipt.pdfUrl && (
            <button
              onClick={() => setViewTab('pdf')}
              className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                viewTab === 'pdf'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Source PDF Document
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {viewTab === 'replica' && (
            /* Fastspot Console Style Official Receipt (Exact visual look of reference PDF) */
            <div className="bg-slate-50 border border-slate-300 rounded-xl p-6 shadow-xs max-w-xl mx-auto font-sans relative">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Fastspot Transfers</h3>
                  <div className="text-[11px] text-slate-500">
                    Operator console · UGX · USD · EUR · DZD
                  </div>
                  <div className="text-[11px] font-mono text-slate-600">
                    {receipt.accountNumber}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Internal tool
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">{receipt.transactionDate}</div>
                </div>
              </div>

              {/* Rates & Fees strip */}
              <div className="my-4 py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs flex justify-between items-center text-slate-700 font-medium">
                <div>
                  <strong className="text-slate-900">Rates &amp; Fees</strong> UGX/USD {receipt.fxUgxUsdRate.toLocaleString()} · Sale {receipt.usdSaleRate.toFixed(2)} · Purchase {receipt.usdPurchaseRate.toFixed(2)} · Fee {receipt.bankFeePercent}%
                </div>
                <span className="text-slate-400 text-[11px]">Verified</span>
              </div>

              {/* Big amount block */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 my-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  You send (UGX)
                </div>
                <div className="text-3xl font-black text-slate-900">
                  {receipt.sourceAmount.toLocaleString()}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                    Cash In (DA)
                  </div>
                  <div className="text-3xl font-black text-emerald-600">
                    {formatCurrency(receipt.targetAmount, 'DZD')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Exact value — no rounding applied.
                  </div>
                </div>
              </div>

              {/* Receipt Table */}
              <div className="relative isolate overflow-hidden bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <img
                  src={faviconUrl}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1/2 z-[-1] h-48 w-48 -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.08]"
                />
                <div className="relative z-10 space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100 flex justify-between">
                    <span>Official Receipt</span>
                    <span className="font-mono text-slate-500">{receipt.referenceCode}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Client / Sender:</span>
                    <span className="font-bold text-slate-900">{receipt.clientName}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">UGX Amount to Send:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(receipt.sourceAmount, 'UGX')}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Principal (UGX):</span>
                    <span className="font-bold text-slate-900">{formatCurrency(receipt.principalAmount, 'UGX')}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">DZD Sale Rate:</span>
                    <span className="font-mono text-slate-900">1 USD = {receipt.usdSaleRate.toFixed(2)} DA</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Bank Fee:</span>
                    <span className="font-mono text-slate-900">+{receipt.bankFeePercent}% ({formatCurrency(receipt.bankFeeAmountUGX, 'UGX')})</span>
                  </div>

                  <div className="flex justify-between pt-2 text-sm font-black text-slate-900">
                    <span>Cash In (DA):</span>
                    <span className="text-emerald-600">{formatCurrency(receipt.targetAmount, 'DZD')}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
                © 2026 Fastspot Transfers · Indicative rates, subject to confirmation at settlement.
              </div>
            </div>
          )}

          {viewTab === 'audit' && (
            /* Commission & Settlement Audit Breakdown */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Principal Status Card */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase">Principal Settlement</span>
                    {receipt.principalSettlementStatus === 'SETTLED' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        SETTLED
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        OUTSTANDING
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-black text-slate-900">
                    {formatCurrency(receipt.principalAmount, 'UGX')}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Payout Counterpart: {formatCurrency(receipt.targetAmount, 'DZD')}
                  </div>
                </div>

                {/* Commission Status Card */}
                <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-purple-900 uppercase">Earned Commission</span>
                    {receipt.commissionSettlementStatus === 'SETTLED' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        SWEPT
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        UNSETTLED
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-black text-purple-900">
                    {formatCurrency(receipt.totalEarnedCommissionUGX, 'UGX')}
                  </div>
                  <div className="text-xs text-purple-700 mt-1">
                    ≈ {formatCurrency(receipt.totalEarnedCommissionDZD, 'DZD')}
                  </div>
                </div>
              </div>

              {/* Mathematical breakdown */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white text-xs space-y-3">
                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  Commission Breakdown &amp; Financial Formula
                </h4>

                <div className="space-y-2 text-slate-600">
                  <div className="flex justify-between">
                    <span>1. USD Conversion Equivalent:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatCurrency(receipt.principalAmount, 'UGX')} ÷ 3,600 = ${receipt.usdEquivalent.toFixed(2)} USD
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>2. FX Spread (separate; not included in commission):</span>
                    <span className="font-mono font-semibold text-slate-900">
                      2.00 DA/USD × ${receipt.usdEquivalent.toFixed(2)} = {receipt.spreadGainDZD.toFixed(2)} DA ({formatCurrency(receipt.spreadGainUGX, 'UGX')})
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>3. Bank Fee ({receipt.bankFeePercent}% of principal):</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatCurrency(receipt.bankFeeAmountUGX, 'UGX')}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>4. Operator Share of Bank Fee:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatCurrency(receipt.feeCommissionShareUGX, 'UGX')}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-purple-900">
                    <span>Total Bank-Fee-Based Commission Earned:</span>
                    <span>{formatCurrency(receipt.totalEarnedCommissionUGX, 'UGX')} ({formatCurrency(receipt.totalEarnedCommissionDZD, 'DZD')})</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewTab === 'pdf' && receipt.pdfUrl && (
            <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-100 h-[500px]">
              <iframe
                src={receipt.pdfUrl}
                className="w-full h-full border-0"
                title="Attached PDF Preview"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={() => {
              onSettle(receipt);
              onClose();
            }}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Settle This Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
