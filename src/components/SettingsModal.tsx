import React, { useState } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  DollarSign, 
  CheckCircle2, 
  Percent, 
  Calculator,
  RotateCcw
} from 'lucide-react';
import { CommissionSettings } from '../types';
import { DEFAULT_SETTINGS, calculateCommission, formatCurrency } from '../utils/financialCalculations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CommissionSettings;
  onSaveSettings: (settings: CommissionSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [localSettings, setLocalSettings] = useState<CommissionSettings>(settings);
  const [testAmount, setTestAmount] = useState<number>(150000);

  if (!isOpen) return null;

  const testCalc = calculateCommission(
    testAmount,
    localSettings.defaultUgxUsdRate,
    localSettings.defaultSaleRate,
    localSettings.defaultPurchaseRate,
    localSettings.defaultFeePercent,
    localSettings.operatorShareOfFeePercent
  );

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const handleResetDefaults = () => {
    setLocalSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <SettingsIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Fastspot Rates &amp; Commission Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Configure default exchange rates, spreads, and operator fee retention
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Rate inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                UGX / USD Exchange Rate
              </label>
              <input
                type="number"
                value={localSettings.defaultUgxUsdRate}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, defaultUgxUsdRate: parseFloat(e.target.value) || 3600 })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-bold"
              />
              <span className="text-[10px] text-slate-400">Current console benchmark: 3,600 UGX</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Bank Fee Percentage (%)
              </label>
              <input
                type="number"
                value={localSettings.defaultFeePercent}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, defaultFeePercent: parseFloat(e.target.value) || 8 })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-bold"
              />
              <span className="text-[10px] text-slate-400">Default Fastspot fee: 8%</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                DZD Sale Rate (DA per USD)
              </label>
              <input
                type="number"
                step="0.1"
                value={localSettings.defaultSaleRate}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, defaultSaleRate: parseFloat(e.target.value) || 238 })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-bold"
              />
              <span className="text-[10px] text-slate-400">Customer rate: 238.00 DA</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                DZD Purchase Rate (DA per USD)
              </label>
              <input
                type="number"
                step="0.1"
                value={localSettings.defaultPurchaseRate}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, defaultPurchaseRate: parseFloat(e.target.value) || 236 })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-bold"
              />
              <span className="text-[10px] text-slate-400">Cost rate: 236.00 DA</span>
            </div>
          </div>

          {/* Commission share */}
          <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-bold text-purple-900">
                Operator Share of Bank Fee: {localSettings.operatorShareOfFeePercent}%
              </label>
              <span className="text-[11px] font-semibold text-purple-700">
                ({100 - localSettings.operatorShareOfFeePercent}% Correspondent Bank)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={localSettings.operatorShareOfFeePercent}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, operatorShareOfFeePercent: parseInt(e.target.value, 10) })
              }
              className="w-full accent-purple-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Determines what portion of the 8% bank fee is credited to your internal earned commissions ledger versus third-party banking charges.
            </p>
          </div>

          {/* Live Simulator Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-indigo-600" />
                Live Calculation Simulator
              </span>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-slate-500">Test Principal:</span>
                <input
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-1.5 py-0.5 rounded border border-slate-300 bg-white font-bold text-right"
                />
                <span className="text-slate-600 font-bold">UGX</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-500">USD Equivalent:</span>
                <span className="font-bold text-slate-900 block">${testCalc.usdEquivalent.toFixed(2)} USD</span>
              </div>
              <div>
                <span className="text-slate-500">FX Spread (not commission):</span>
                <span className="font-bold text-slate-900 block">{testCalc.spreadGainDZD.toFixed(2)} DA</span>
              </div>
              <div>
                <span className="text-slate-500">Bank Fee Commission ({localSettings.operatorShareOfFeePercent}% share):</span>
                <span className="font-bold text-slate-900 block">{formatCurrency(testCalc.feeCommissionShareUGX, 'UGX')}</span>
              </div>
              <div>
                <span className="text-slate-500">Total Earned Commission:</span>
                <span className="font-black text-purple-700 block text-xs">{formatCurrency(testCalc.totalEarnedCommissionUGX, 'UGX')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            type="button"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Apply Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
