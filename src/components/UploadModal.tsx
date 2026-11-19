import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Calculator,
  ChevronDown,
  Plus,
  Trash2
} from 'lucide-react';
import { CommissionSettings, TransactionReceipt, TransferType } from '../types';
import {
  calculateManualSendPayout,
  createReceiptFromExtracted,
  formatCurrency,
  ManualSendFeeTier,
} from '../utils/financialCalculations';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReceipt: (receipt: TransactionReceipt) => void;
  settings: CommissionSettings;
  initialTransferType: TransferType;
  manualSendFeeTiers: ManualSendFeeTier[];
  onUpdateManualSendFeeTiers: (tiers: ManualSendFeeTier[] | ((previous: ManualSendFeeTier[]) => ManualSendFeeTier[])) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onAddReceipt,
  settings,
  initialTransferType,
  manualSendFeeTiers,
  onUpdateManualSendFeeTiers,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [currentFilename, setCurrentFilename] = useState<string>('');
  const [extractionMethod, setExtractionMethod] = useState<string>('');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('');
  const [isManualConsoleOpen, setIsManualConsoleOpen] = useState(false);
  const [manualSendAmount, setManualSendAmount] = useState('150000');
  const [manualClientName, setManualClientName] = useState('');
  const [manualSaveError, setManualSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const manualPayout = calculateManualSendPayout(
    Number(manualSendAmount),
    manualSendFeeTiers,
    settings
  );

  const updateManualSendFeeTier = (
    tierId: string,
    field: keyof Omit<ManualSendFeeTier, 'id'>,
    value: string
  ) => {
    onUpdateManualSendFeeTiers((tiers) =>
      tiers.map((tier) => {
        if (tier.id !== tierId) return tier;
        if (field === 'maxAmountUGX') {
          return { ...tier, maxAmountUGX: value === '' ? null : Number(value) };
        }
        return { ...tier, [field]: Number(value) };
      })
    );
  };

  const addManualSendFeeTier = () => {
    onUpdateManualSendFeeTiers((tiers) => {
      const sorted = [...tiers].sort((a, b) => a.minAmountUGX - b.minAmountUGX);
      const lastTier = sorted[sorted.length - 1];
      const nextMinimum = lastTier
        ? (lastTier.maxAmountUGX ?? lastTier.minAmountUGX) + 1
        : 1;
      const updatedTiers = lastTier?.maxAmountUGX === null
        ? tiers.map((tier) =>
            tier.id === lastTier.id ? { ...tier, maxAmountUGX: nextMinimum - 1 } : tier
          )
        : tiers;

      return [
        ...updatedTiers,
        {
          id: `tier-${Date.now()}`,
          minAmountUGX: nextMinimum,
          maxAmountUGX: null,
          feeUGX: lastTier?.feeUGX ?? 0,
        },
      ];
    });
  };

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF transaction report or receipt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentFilename(file.name);

    try {
      // Create local object URL for PDF preview
      const localUrl = URL.createObjectURL(file);
      setPdfPreviewUrl(localUrl);

      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const res = reader.result as string;
          // strip "data:application/pdf;base64,"
          const base64 = res.split(',')[1] || res;
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);

      const base64Data = await base64Promise;

      // Call API endpoint
      const response = await fetch('/api/parse-receipt-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: base64Data,
          filename: file.name,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error ${response.status}`);
      }

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setExtractedData(resJson.data);
        setExtractionMethod(resJson.method || 'gemini-3.8-flash');
      } else {
        throw new Error(resJson.error || 'Failed to extract receipt data');
      }
    } catch (err: any) {
      console.error('Extraction error:', err);
      setError(err.message || 'Error parsing PDF. Please try again or check the file format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSampleMoris = async () => {
    setIsLoading(true);
    setError(null);
    setCurrentFilename('Moris_-_150000ugx_f15554df.pdf');
    setPdfPreviewUrl('/assets/aistudio/Moris_-_150000ugx_f15554df.pdf');

    try {
      const response = await fetch('/api/parse-receipt-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useSample: true,
          filename: 'Moris_-_150000ugx_f15554df.pdf',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load sample reference PDF');
      }

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setExtractedData(resJson.data);
        setExtractionMethod(resJson.method || 'gemini-3.8-flash');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process sample reference receipt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmAndAdd = () => {
    if (!extractedData) return;

    const newReceipt = createReceiptFromExtracted(
      { ...extractedData, transferType: initialTransferType },
      currentFilename,
      pdfPreviewUrl,
      settings
    );

    onAddReceipt(newReceipt);
    handleReset();
    onClose();
  };

  const handleSaveManualSend = () => {
    const sourceAmount = Number(manualSendAmount);
    if (!manualClientName.trim()) {
      setManualSaveError('Enter the client or sender name before saving.');
      return;
    }
    if (!Number.isFinite(sourceAmount) || sourceAmount <= 0) {
      setManualSaveError('Enter a valid amount to send before saving.');
      return;
    }
    if (!manualPayout.feeTier) {
      setManualSaveError('Add or adjust a fee tier that covers this amount before saving.');
      return;
    }

    const newReceipt = createReceiptFromExtracted(
      {
        clientName: manualClientName.trim(),
        transferType: 'SEND',
        sourceCurrency: 'UGX',
        sourceAmount: manualPayout.amountUGX,
        principalAmount: manualPayout.totalUGX,
        targetCurrency: 'DZD',
        targetAmount: manualPayout.cashInDA,
        fxUgxUsdRate: settings.defaultUgxUsdRate,
        usdSaleRate: settings.defaultSaleRate,
        usdPurchaseRate: settings.defaultPurchaseRate,
        bankFeePercent: settings.defaultFeePercent,
        notes: `Manual operator console. Amount to send: ${formatCurrency(manualPayout.amountUGX, 'UGX')}; sending fee: ${formatCurrency(manualPayout.sendingFeeUGX, 'UGX')} (tier ${manualPayout.feeTier.minAmountUGX.toLocaleString()}-${manualPayout.feeTier.maxAmountUGX?.toLocaleString() ?? 'above'} UGX); total UGX converted: ${formatCurrency(manualPayout.totalUGX, 'UGX')}.`,
      },
      'Manual operator console',
      '',
      settings
    );

    onAddReceipt(newReceipt);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setExtractedData(null);
    setCurrentFilename('');
    setPdfPreviewUrl('');
    setError(null);
    setIsLoading(false);
    setIsManualConsoleOpen(false);
    setManualSendAmount('150000');
    setManualClientName('');
    setManualSaveError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Upload Transaction PDF Receipt</h2>
              <p className="text-xs text-slate-500">
                Automated extraction of Fastspot console report, rates, fees & settlement figures
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!extractedData && !isLoading && (
            <div>
              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-600 bg-indigo-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />
                <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Drop your PDF receipt report here, or <span className="text-indigo-600 underline">browse</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Supports Fastspot Transfers operator receipts, exchange reports, and clearing slips (PDF)
                </p>
              </div>

              {/* Sample test option */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-950">
                        Test with Attached Reference PDF
                      </div>
                      <div className="text-[11px] text-amber-800">
                        Moris - 150,000 UGX (Laposte console receipt with 10,813.53 DA cash in)
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLoadSampleMoris}
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    Test Load
                  </button>
                </div>
              </div>

              {initialTransferType === 'SEND' && (
                <div className="mt-4">
                  <button
                    type="button"
                    aria-expanded={isManualConsoleOpen}
                    onClick={() => setIsManualConsoleOpen((open) => !open)}
                    className="flex w-full items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-left transition-colors hover:bg-indigo-100 cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-sm font-bold text-indigo-900">
                      <Calculator className="h-4 w-4" />
                      Populate Receipt Manually
                    </span>
                    <span className="text-xs font-semibold text-indigo-700">
                      {isManualConsoleOpen ? 'Close' : 'Open operator console'}
                    </span>
                  </button>

                  {isManualConsoleOpen && (
                    <section className="mt-3 space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Send Money Operator Console</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Enter the UGX amount. The payout preview applies the sending fee, converts through USD to DA, then adds the 8% bank fee.
                        </p>
                      </div>

                      <label className="block text-xs font-semibold text-slate-700">
                        Client / Sender
                        <input
                          type="text"
                          value={manualClientName}
                          onChange={(event) => setManualClientName(event.target.value)}
                          placeholder="Enter sender name"
                          autoComplete="name"
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </label>

                      <label className="block text-xs font-semibold text-slate-700">
                        Amount to send (UGX)
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={manualSendAmount}
                          onChange={(event) => setManualSendAmount(event.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-lg font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </label>

                      <details className="group rounded-lg border border-slate-200">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-xs font-bold text-slate-700">
                          <span>
                            Sending fee tiers
                            {manualPayout.feeTier && (
                              <span className="ml-2 font-normal text-slate-500">
                                Matched: {manualPayout.feeTier.minAmountUGX.toLocaleString()}–
                                {manualPayout.feeTier.maxAmountUGX?.toLocaleString() ?? 'above'} UGX ·{' '}
                                {formatCurrency(manualPayout.feeTier.feeUGX, 'UGX')}
                              </span>
                            )}
                          </span>
                          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="space-y-3 border-t border-slate-200 p-3">
                          <p className="text-[11px] text-slate-500">
                            Edit the amount brackets and fees. Changes are saved in this browser.
                          </p>
                          <div className="space-y-2">
                            {manualSendFeeTiers
                              .slice()
                              .sort((a, b) => a.minAmountUGX - b.minAmountUGX)
                              .map((tier, index) => (
                                <div
                                  key={tier.id}
                                  className="grid grid-cols-2 items-end gap-2 rounded-lg bg-slate-50 p-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
                                >
                                  <label className="text-[10px] font-semibold text-slate-600">
                                    Min UGX
                                    <input
                                      type="number"
                                      min="0"
                                      value={tier.minAmountUGX}
                                      onChange={(event) =>
                                        updateManualSendFeeTier(tier.id, 'minAmountUGX', event.target.value)
                                      }
                                      className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs"
                                    />
                                  </label>
                                  <label className="text-[10px] font-semibold text-slate-600">
                                    Max UGX
                                    <input
                                      type="number"
                                      min={tier.minAmountUGX}
                                      placeholder="No limit"
                                      value={tier.maxAmountUGX ?? ''}
                                      onChange={(event) =>
                                        updateManualSendFeeTier(tier.id, 'maxAmountUGX', event.target.value)
                                      }
                                      className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs"
                                    />
                                  </label>
                                  <label className="text-[10px] font-semibold text-slate-600">
                                    Fee UGX
                                    <input
                                      type="number"
                                      min="0"
                                      value={tier.feeUGX}
                                      onChange={(event) =>
                                        updateManualSendFeeTier(tier.id, 'feeUGX', event.target.value)
                                      }
                                      className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs"
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateManualSendFeeTiers((tiers) =>
                                        tiers.filter((item) => item.id !== tier.id)
                                      )
                                    }
                                    disabled={manualSendFeeTiers.length <= 1}
                                    aria-label={`Remove fee tier ${index + 1}`}
                                    className="mb-0.5 rounded p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                          </div>
                          <button
                            type="button"
                            onClick={addManualSendFeeTier}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add fee tier
                          </button>
                        </div>
                      </details>

                      <div className="rounded-lg bg-slate-50 p-3 text-xs">
                        <div className="flex justify-between gap-4 py-1 text-slate-600">
                          <span>Sending fee</span>
                          <span className="font-mono font-semibold">
                            {manualPayout.feeTier
                              ? formatCurrency(manualPayout.sendingFeeUGX, 'UGX')
                              : 'No matching fee tier'}
                          </span>
                        </div>
                        {!manualPayout.feeTier && Number(manualSendAmount) > 0 && (
                          <p className="text-xs font-semibold text-amber-700">
                            This amount is outside the configured fee tiers. Add or adjust a tier to calculate its sending fee.
                          </p>
                        )}
                        <div className="flex justify-between gap-4 py-1 text-slate-600">
                          <span>Total UGX for conversion</span>
                          <span className="font-mono font-semibold">{formatCurrency(manualPayout.totalUGX, 'UGX')}</span>
                        </div>
                        <div className="flex justify-between gap-4 py-1 text-slate-600">
                          <span>USD at {manualPayout.ugxPerUsd.toLocaleString()} UGX/USD</span>
                          <span className="font-mono font-semibold">${manualPayout.usdAmount.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between gap-4 py-1 text-slate-600">
                          <span>DA base at {manualPayout.daPerUsd} DA/USD</span>
                          <span className="font-mono font-semibold">{formatCurrency(manualPayout.daBase, 'DA')}</span>
                        </div>
                        <div className="mt-2 flex justify-between gap-4 border-t border-slate-200 pt-3 text-sm font-black text-emerald-800">
                          <span>Cash In (DA) — includes {manualPayout.bankFeePercent}% bank fee</span>
                          <span className="text-right">
                            {manualPayout.feeTier || Number(manualSendAmount) <= 0
                              ? formatCurrency(manualPayout.cashInDA, 'DA')
                              : '—'}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500">
                        Save this transaction to the receipts history when the sender and fee tier are confirmed.
                      </p>
                      {manualSaveError && (
                        <p role="alert" className="text-xs font-semibold text-rose-700">
                          {manualSaveError}
                        </p>
                      )}
                      <div className="flex justify-end border-t border-slate-100 pt-3">
                        <button
                          type="button"
                          onClick={handleSaveManualSend}
                          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 cursor-pointer"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Save to History Ledger
                        </button>
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          )}

          {isLoading && (
            <div className="py-12 text-center">
              <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-800">
                Parsing PDF Receipt Report...
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Extracting transaction amounts, principal, exchange rates (UGX/USD 3,600, Sale 238), bank fees (8%), and computing commission shares.
              </p>
            </div>
          )}

          {/* Extracted Data Review & Confirmation */}
          {extractedData && !isLoading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Successfully extracted from: <strong className="font-bold">{currentFilename}</strong></span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                  {extractionMethod}
                </span>
              </div>

              {/* Form fields for review & adjustment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Client / Sender Name</label>
                  <input
                    type="text"
                    value={extractedData.clientName || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, clientName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Operator Account</label>
                  <input
                    type="text"
                    value={extractedData.accountNumber || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, accountNumber: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Source Amount (UGX)</label>
                  <input
                    type="number"
                    value={extractedData.sourceAmount || 0}
                    onChange={(e) => setExtractedData({ ...extractedData, sourceAmount: parseFloat(e.target.value) || 0, principalAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Cash In (DA / DZD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={extractedData.targetAmount || 0}
                    onChange={(e) => setExtractedData({ ...extractedData, targetAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">UGX / USD Rate</label>
                  <input
                    type="number"
                    value={extractedData.fxUgxUsdRate || 3600}
                    onChange={(e) => setExtractedData({ ...extractedData, fxUgxUsdRate: parseFloat(e.target.value) || 3600 })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">DZD Sale Rate (per USD)</label>
                  <input
                    type="number"
                    value={extractedData.usdSaleRate || 238}
                    onChange={(e) => setExtractedData({ ...extractedData, usdSaleRate: parseFloat(e.target.value) || 238 })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Bank Fee %</label>
                  <input
                    type="number"
                    value={extractedData.bankFeePercent || 8}
                    onChange={(e) => setExtractedData({ ...extractedData, bankFeePercent: parseFloat(e.target.value) || 8 })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Transaction Reference</label>
                  <input
                    type="text"
                    value={extractedData.referenceCode || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, referenceCode: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Commission computation preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-700">Calculated Earned Commission:</span>
                  <p className="text-[11px] text-slate-500">Includes FX Spread margin + 50% operator fee share</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-purple-700">
                    {formatCurrency(
                      ((extractedData.sourceAmount || 150000) * 0.08 * 0.5) +
                      (((238 - 236) * ((extractedData.sourceAmount || 150000) / 3600) / 238) * 3600),
                      'UGX'
                    )}
                  </span>
                  <div className="text-[10px] text-slate-500">Will be tracked separately from principal</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {extractedData ? (
            <>
              <button
                onClick={handleReset}
                type="button"
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Upload Different File
              </button>
              <button
                onClick={handleConfirmAndAdd}
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save to History Ledger</span>
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                type="button"
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
