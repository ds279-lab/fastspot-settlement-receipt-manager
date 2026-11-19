import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ArrowRight, 
  ShieldCheck, 
  Building2, 
  Sparkles,
  Percent,
  RefreshCw,
  Calculator,
  Layers,
  FileText
} from 'lucide-react';
import { CommissionSettings, TransactionReceipt } from '../types';
import {
  calculateCommission,
  calculateManualSendPayout,
  formatCurrency,
  ManualSendFeeTier,
} from '../utils/financialCalculations';

interface RatesCalculatorViewProps {
  settings: CommissionSettings;
  onUpdateSettings: (settings: CommissionSettings) => void;
  receipts: TransactionReceipt[];
  onOpenUpload: () => void;
  manualSendFeeTiers: ManualSendFeeTier[];
}

export const RatesCalculatorView: React.FC<RatesCalculatorViewProps> = ({
  settings,
  onUpdateSettings,
  receipts,
  onOpenUpload,
  manualSendFeeTiers,
}) => {
  const [calcAmount, setCalcAmount] = useState<number>(150000);
  const [direction, setDirection] = useState<'SEND' | 'RECEIVE'>('SEND');

  const result = calculateCommission(
    calcAmount,
    settings.defaultUgxUsdRate,
    settings.defaultSaleRate,
    settings.defaultPurchaseRate,
    settings.defaultFeePercent,
    settings.operatorShareOfFeePercent
  );

  const manualSendPayout = calculateManualSendPayout(calcAmount, manualSendFeeTiers, settings);
  const receiveCashInDZD =
    (calcAmount / settings.defaultUgxUsdRate) *
    settings.defaultSaleRate *
    (1 + settings.defaultFeePercent / 100);

  return (
    <div className="space-y-6">
      {/* Top Banner explaining Fastspot Transfers reference PDF model */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              Fastspot Transfers Reference Benchmark
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">
              Dual-Currency Corridor (UGX → USD → DZD)
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              Payouts use the configured UGX/USD, DA/USD, and bank fee rates, plus the same UGX sending-fee tiers used by the Send Money operator console.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={onOpenUpload}
              type="button"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Upload New PDF Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Live Calculator & Financial Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Operator Console Calculator */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Calculator className="h-4 w-4 text-indigo-600" />
              Operator Console Payout Calculator
            </h3>
            <span className="text-[11px] font-mono text-slate-500">Laposte - 007 99999 0043606637 24</span>
          </div>

          {/* Direction toggle */}
          <div className="flex p-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
            <button
              onClick={() => setDirection('SEND')}
              className={`flex-1 py-1.5 rounded-md text-center transition-all cursor-pointer ${
                direction === 'SEND' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Send Money (UGX → DZD)
            </button>
            <button
              onClick={() => setDirection('RECEIVE')}
              className={`flex-1 py-1.5 rounded-md text-center transition-all cursor-pointer ${
                direction === 'RECEIVE' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Receive Money (DZD → UGX)
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Transfer Amount (UGX)
            </label>
            <div className="relative">
              <input
                type="number"
                value={calcAmount}
                onChange={(e) => setCalcAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full text-2xl font-black text-slate-900 px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                UGX
              </span>
            </div>
          </div>

          {/* Result Cash-In Display */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Cash In (DA) — Payout Amount
            </div>
            <div className="text-3xl font-black text-emerald-700 mt-0.5">
              {direction === 'SEND' && !manualSendPayout.feeTier
                ? 'No matching fee tier'
                : `${(direction === 'SEND' ? manualSendPayout.cashInDA : receiveCashInDZD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA`}
            </div>
            <div className="text-[11px] text-emerald-900/70 mt-1">
              {direction === 'SEND'
                ? 'Uses the configured sending-fee tier and the same payout formula as Send Money.'
                : 'Uses the configured UGX/USD, DA/USD, and bank-fee rates.'}
            </div>
          </div>

          {/* Breakdown Steps */}
          <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-2 bg-slate-50/50">
            <div className="font-bold text-slate-800 pb-1 border-b border-slate-200">
              Calculation Audit Trail:
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Principal:</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(calcAmount, 'UGX')}</span>
            </div>
            {direction === 'SEND' && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>
                    Sending Fee
                    {manualSendPayout.feeTier &&
                      ` (${manualSendPayout.feeTier.minAmountUGX.toLocaleString()}–${manualSendPayout.feeTier.maxAmountUGX?.toLocaleString() ?? 'above'} UGX):`}
                    {!manualSendPayout.feeTier && ':'}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {manualSendPayout.feeTier
                      ? formatCurrency(manualSendPayout.sendingFeeUGX, 'UGX')
                      : 'No matching fee tier'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total UGX for conversion:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(manualSendPayout.totalUGX, 'UGX')}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Benchmark Rate (UGX/USD):</span>
              <span className="font-mono">{settings.defaultUgxUsdRate.toLocaleString()} UGX = $1.00 USD</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>USD Equivalent:</span>
              <span className="font-mono font-bold text-slate-900">
                ${(direction === 'SEND' ? manualSendPayout.usdAmount : result.usdEquivalent).toFixed(2)} USD
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>DZD Sale Rate:</span>
              <span className="font-mono">1 USD = {settings.defaultSaleRate.toFixed(2)} DA</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Bank Fee (+{settings.defaultFeePercent}%):</span>
              <span className="font-mono font-bold text-amber-700">
                +{formatCurrency(
                  direction === 'SEND'
                    ? manualSendPayout.daBase * (settings.defaultFeePercent / 100)
                    : receiveCashInDZD - (calcAmount / settings.defaultUgxUsdRate) * settings.defaultSaleRate,
                  'DA'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Commission & Spread Breakdown */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-xl border border-purple-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <h3 className="font-bold text-purple-950 text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                Earned Commission Engine
              </h3>
              <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                Bank Fee Only
              </span>
            </div>

            <div className="space-y-3">
              {/* FX Spread Gain */}
              <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-purple-900">FX Spread (not commission)</span>
                  <span className="font-bold text-purple-950">
                    {result.spreadGainDZD.toFixed(2)} DA
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Sale 238.00 − Purchase 236.00 = 2.00 DA/USD × ${result.usdEquivalent.toFixed(2)} USD
                </div>
                <div className="text-right text-[11px] font-bold text-purple-700 mt-1">
                  ≈ {formatCurrency(result.spreadGainUGX, 'UGX')}
                </div>
              </div>

              {/* Bank Fee Share */}
              <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-purple-900">Bank Fee Commission Share</span>
                  <span className="font-bold text-purple-950">
                    {formatCurrency(result.feeCommissionShareUGX, 'UGX')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {settings.operatorShareOfFeePercent}% of {settings.defaultFeePercent}% bank fee ({formatCurrency(result.bankFeeAmountUGX, 'UGX')})
                </div>
              </div>

              {/* Total Earned Commission */}
              <div className="p-4 bg-purple-900 text-white rounded-xl shadow-xs">
                <div className="text-xs text-purple-200 uppercase font-semibold">
                  Bank-Fee-Based Earned Commission
                </div>
                <div className="text-2xl font-black mt-1">
                  {formatCurrency(result.totalEarnedCommissionUGX, 'UGX')}
                </div>
                <div className="text-xs text-purple-300 mt-0.5">
                  ≈ {formatCurrency(result.totalEarnedCommissionDZD, 'DZD')}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Rates Summary Widget */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs text-xs space-y-2">
            <div className="font-bold text-slate-900 border-b border-slate-100 pb-2">
              Active Console Benchmarks
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">UGX / USD Benchmark:</span>
              <span className="font-mono font-bold text-slate-800">{settings.defaultUgxUsdRate.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">DZD Sale Rate:</span>
              <span className="font-mono font-bold text-slate-800">{settings.defaultSaleRate.toFixed(2)} DA</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">DZD Purchase Rate:</span>
              <span className="font-mono font-bold text-slate-800">{settings.defaultPurchaseRate.toFixed(2)} DA</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Bank Fee Rate:</span>
              <span className="font-mono font-bold text-emerald-700">+{settings.defaultFeePercent}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
