import React, { useEffect, useState } from 'react';
import faviconUrl from '../../path/favicon.ico';
import { 
  Layers, 
  DollarSign, 
  Settings as SettingsIcon, 
  FileSpreadsheet,
  RotateCcw,
  HandCoins,
  X,
  Home
} from 'lucide-react';
interface NavbarProps {
  activeTab: 'home' | 'receipts' | 'settlements' | 'rates' | 'loans';
  setActiveTab: (tab: 'home' | 'receipts' | 'settlements' | 'rates' | 'loans') => void;
  onOpenSettlement: () => void;
  onOpenSettings: () => void;
  onResetData: () => void;
  outstandingCount: number;
  activeLoansCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettlement,
  onOpenSettings,
  onResetData,
  outstandingCount,
  activeLoansCount,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      {/* Top micro-bar */}
      <div className="bg-slate-900 text-slate-300 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            FASTSPOT TRANSFERS
          </span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-300 hidden sm:inline">Operator console · UGX · USD · EUR · DZD</span>
          <span className="text-slate-500 hidden md:inline">Laposte - 007 99999 0043606637 24</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300 font-mono">
            Rate: 1 USD = 238.00 DA · Fee: 8%
          </span>
          <span className="text-emerald-400 text-[11px] font-medium bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
            Internal Tool
          </span>
        </div>
      </div>

      {/* Main header row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
            aria-controls="app-navigation-drawer"
            className="shrink-0 rounded-xl cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <img
              src={faviconUrl}
              alt=""
              className="h-10 w-10 rounded-xl object-contain shadow-sm ring-2 ring-indigo-500/20 transition-shadow hover:ring-indigo-500/50"
            />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Settlement & Receipt Manager</h1>
            </div>
            <p className="text-xs text-slate-500">
              PDF transaction report summarizer, cumulative settlement & commission engine
            </p>
          </div>
        </div>

        {/* Action button cluster */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenSettlement}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer relative"
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Settle Batch</span>
            {outstandingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-800 text-[10px] text-emerald-100 font-bold">
                {outstandingCount}
              </span>
            )}
          </button>

        </div>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsMenuOpen(false)}
            className="absolute inset-0 h-full w-full bg-slate-950/50"
          />
          <aside
            id="app-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="navigation-drawer-title"
            className="absolute inset-y-0 left-0 flex w-[min(22rem,85vw)] flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 id="navigation-drawer-title" className="font-bold text-slate-900">
                  Navigation
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">Settlement &amp; Receipt Manager</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close navigation menu"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto p-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('home');
                  setIsMenuOpen(false);
                }}
                aria-current={activeTab === 'home' ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'home'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Home className="h-4 w-4 shrink-0" />
                <span>Home</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('receipts');
                  setIsMenuOpen(false);
                }}
                aria-current={activeTab === 'receipts' ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'receipts'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Layers className="h-4 w-4 shrink-0" />
                <span>Receipts &amp; Transactions</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('settlements');
                  setIsMenuOpen(false);
                }}
                aria-current={activeTab === 'settlements' ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'settlements'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4 shrink-0" />
                <span>Settlement Ledger &amp; History</span>
                {outstandingCount > 0 && (
                  <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    {outstandingCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('rates');
                  setIsMenuOpen(false);
                }}
                aria-current={activeTab === 'rates' ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'rates'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <DollarSign className="h-4 w-4 shrink-0" />
                <span>Fastspot Rates &amp; Commission Engine</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('loans');
                  setIsMenuOpen(false);
                }}
                aria-current={activeTab === 'loans' ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'loans'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <HandCoins className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Money Lent</span>
                {activeLoansCount !== undefined && activeLoansCount > 0 && (
                  <span className="ml-auto rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    {activeLoansCount}
                  </span>
                )}
              </button>

              <div className="my-3 border-t border-slate-200" />

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenSettings();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
              >
                <SettingsIcon className="h-4 w-4 shrink-0" />
                <span>Commission &amp; FX Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onResetData();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4 shrink-0" />
                <span>Reset to Initial Seed</span>
              </button>
            </nav>

            <div className="border-t border-slate-200 px-5 py-3 text-[11px] text-slate-500">
              FASTSPOT TRANSFERS · Internal Tool
            </div>
          </aside>
        </div>
      )}
    </header>
  );
};
