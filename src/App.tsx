/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SummaryMetrics } from './components/SummaryMetrics';
import { ReceiptsTable } from './components/ReceiptsTable';
import { UploadModal } from './components/UploadModal';
import { SettlementModal } from './components/SettlementModal';
import { SettlementHistoryLedger } from './components/SettlementHistoryLedger';
import { ReceiptDetailModal } from './components/ReceiptDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { RatesCalculatorView } from './components/RatesCalculatorView';
import { MoneyLentView } from './components/MoneyLentView';
import { HomeDashboard } from './components/HomeDashboard';
import { 
  TransactionReceipt, 
  SettlementRecord, 
  CommissionSettings, 
  SettlementType,
  MoneyLentRecord,
  LoanStatus,
  LoanPayment
} from './types';
import { 
  DEFAULT_SETTINGS, 
  normalizeReceiptCommissionToBankFeeOnly,
} from './utils/financialCalculations';
import { 
  INITIAL_RECEIPTS, 
  INITIAL_SETTLEMENTS,
  INITIAL_LOANS 
} from './utils/initialData';
import { getLoanRemainingBalance, mergeLoansByRecipientAndCurrency } from './utils/loanCalculations';
import { ManualSendFeeTier } from './utils/financialCalculations';
import { loadManualSendFeeTiers, MANUAL_SEND_FEES_STORAGE_KEY } from './utils/manualSendFeeTiers';
import { CheckCircle2, FileText, AlertCircle, X } from 'lucide-react';

const STORAGE_KEYS = {
  RECEIPTS: 'fastspot_receipts_v2',
  SETTLEMENTS: 'fastspot_settlements_v2',
  SETTINGS: 'fastspot_settings_v2',
  LOANS: 'fastspot_loans_v2',
};

export default function App() {
  // Load state from localStorage or initial seed
  const [receipts, setReceipts] = useState<TransactionReceipt[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECEIPTS);
      if (saved) return JSON.parse(saved).map(normalizeReceiptCommissionToBankFeeOnly);
    } catch (e) {
      console.warn('Failed to load receipts from localStorage:', e);
    }
    return INITIAL_RECEIPTS;
  });

  const [settlements, setSettlements] = useState<SettlementRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTLEMENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load settlements from localStorage:', e);
    }
    return INITIAL_SETTLEMENTS;
  });

  const [settings, setSettings] = useState<CommissionSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load settings from localStorage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [manualSendFeeTiers, setManualSendFeeTiers] = useState<ManualSendFeeTier[]>(() =>
    loadManualSendFeeTiers()
  );

  const [loans, setLoans] = useState<MoneyLentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOANS);
      if (saved) return mergeLoansByRecipientAndCurrency(JSON.parse(saved));
    } catch (e) {
      console.warn('Failed to load loans from localStorage:', e);
    }
    return INITIAL_LOANS;
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'home' | 'receipts' | 'settlements' | 'rates' | 'loans'>('home');
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<string[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTransferType, setUploadTransferType] = useState<'SEND' | 'RECEIVE'>('SEND');
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);
  const [settlementType, setSettlementType] = useState<SettlementType>('PRINCIPAL');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<TransactionReceipt | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
    } catch (e) {
      console.error(e);
    }
  }, [receipts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements));
    } catch (e) {
      console.error(e);
    }
  }, [settlements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
    } catch (e) {
      console.error(e);
    }
  }, [loans]);

  useEffect(() => {
    try {
      localStorage.setItem(MANUAL_SEND_FEES_STORAGE_KEY, JSON.stringify(manualSendFeeTiers));
    } catch (e) {
      console.error('Failed to save manual send fee tiers:', e);
    }
  }, [manualSendFeeTiers]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Add new parsed receipt
  const handleAddReceipt = (newReceipt: TransactionReceipt) => {
    setReceipts((prev) => [newReceipt, ...prev]);
    showToast(`Added receipt for ${newReceipt.clientName} (${newReceipt.referenceCode})`);
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedReceiptIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllOutstanding = () => {
    const outstandingIds = receipts
      .filter((r) => r.principalSettlementStatus !== 'SETTLED' || r.commissionSettlementStatus !== 'SETTLED')
      .map((r) => r.id);
    setSelectedReceiptIds(outstandingIds);
    showToast(`Selected ${outstandingIds.length} outstanding receipt(s)`);
  };

  const handleClearSelection = () => {
    setSelectedReceiptIds([]);
  };

  // Execute settlement
  const handleExecuteSettlement = (
    newRecord: SettlementRecord,
    updatedReceiptIds: string[],
    type: SettlementType
  ) => {
    setReceipts((prev) =>
      prev.map((r) => {
        if (!updatedReceiptIds.includes(r.id)) return r;

        let principalSettlementStatus = r.principalSettlementStatus;
        let settledPrincipalUGX = r.settledPrincipalUGX;
        let settledPrincipalDZD = r.settledPrincipalDZD;

        let commissionSettlementStatus = r.commissionSettlementStatus;
        let settledCommissionUGX = r.settledCommissionUGX;
        let settledCommissionDZD = r.settledCommissionDZD;

        if (type === 'PRINCIPAL' || type === 'BOTH') {
          principalSettlementStatus = 'SETTLED';
          settledPrincipalUGX = r.principalAmount;
          settledPrincipalDZD = r.targetAmount;
        }

        if (type === 'COMMISSION' || type === 'BOTH') {
          commissionSettlementStatus = 'SETTLED';
          settledCommissionUGX = r.totalEarnedCommissionUGX;
          settledCommissionDZD = r.totalEarnedCommissionDZD;
        }

        return {
          ...r,
          principalSettlementStatus,
          settledPrincipalUGX,
          settledPrincipalDZD,
          commissionSettlementStatus,
          settledCommissionUGX,
          settledCommissionDZD,
          settlementBatchIds: [...(r.settlementBatchIds || []), newRecord.id],
        };
      })
    );

    setSettlements((prev) => [newRecord, ...prev]);
    setSelectedReceiptIds([]);
    showToast(`Settlement ${newRecord.batchNumber} executed successfully!`);
  };

  // Single settle
  const handleSingleSettle = (receipt: TransactionReceipt) => {
    setSelectedReceiptIds([receipt.id]);
    setSettlementType(
      receipt.principalSettlementStatus !== 'SETTLED' ? 'PRINCIPAL' : 'COMMISSION'
    );
    setIsSettlementOpen(true);
  };

  // Delete receipt
  const handleDeleteReceipt = (id: string) => {
    const target = receipts.find((r) => r.id === id);
    if (confirm(`Are you sure you want to delete receipt ${target?.referenceCode || id}?`)) {
      setReceipts((prev) => prev.filter((r) => r.id !== id));
      setSelectedReceiptIds((prev) => prev.filter((itemId) => itemId !== id));
      showToast('Receipt removed from ledger');
    }
  };

  // Loan Handlers
  const handleAddLoan = (newLoan: MoneyLentRecord) => {
    setLoans((prev) => mergeLoansByRecipientAndCurrency([newLoan, ...prev]));
    showToast(`Recorded loan of ${newLoan.amount} ${newLoan.currency} to ${newLoan.recipientName}; any matching records were consolidated`);
  };

  const handleDeleteLoan = (id: string) => {
    const target = loans.find((l) => l.id === id);
    if (confirm(`Are you sure you want to delete the loan record for ${target?.recipientName || 'this recipient'}?`)) {
      setLoans((prev) => prev.filter((l) => l.id !== id));
      showToast('Loan record deleted');
    }
  };

  const handleToggleLoanStatus = (id: string) => {
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const nextStatus: LoanStatus = l.status === 'ACTIVE' ? 'REPAID' : 'ACTIVE';
        showToast(`Loan for ${l.recipientName} marked as ${nextStatus}`);
        return { ...l, status: nextStatus };
      })
    );
  };

  const handleRecordLoanPayment = (id: string, payment: LoanPayment) => {
    const loan = loans.find((record) => record.id === id);
    if (!loan) {
      showToast('Could not record payment: loan record was not found');
      return;
    }

    const remainingBalance = getLoanRemainingBalance(loan);
    if (payment.amount <= 0 || payment.amount > remainingBalance) {
      showToast('Could not record payment: amount exceeds the remaining balance');
      return;
    }

    const payments = [...(loan.payments ?? []), payment];
    const updatedLoan = { ...loan, payments };
    const paidOff = getLoanRemainingBalance(updatedLoan) === 0;

    setLoans((prev) =>
      prev.map((record) =>
        record.id === id
          ? { ...record, payments, status: paidOff ? 'REPAID' : record.status }
          : record
      )
    );
    showToast(
      paidOff
        ? `${loan.recipientName}'s loan is fully repaid`
        : `Recorded ${payment.amount} ${loan.currency} payment for ${loan.recipientName}`
    );
  };

  // Reset to initial seed
  const handleResetData = () => {
    if (confirm('Reset all transaction receipts, settlements, and loans to initial demo data?')) {
      localStorage.removeItem(STORAGE_KEYS.RECEIPTS);
      localStorage.removeItem(STORAGE_KEYS.SETTLEMENTS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.LOANS);
      setReceipts(INITIAL_RECEIPTS);
      setSettlements(INITIAL_SETTLEMENTS);
      setSettings(DEFAULT_SETTINGS);
      setLoans(INITIAL_LOANS);
      setSelectedReceiptIds([]);
      setActiveTab('home');
      showToast('Reset all data to initial state');
    }
  };

  const outstandingPrincipalCount = receipts.filter(
    (r) => r.principalSettlementStatus !== 'SETTLED'
  ).length;

  const activeLoansCount = loans.filter((l) => l.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettlement={() => {
          setSettlementType('PRINCIPAL');
          setIsSettlementOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetData={handleResetData}
        outstandingCount={outstandingPrincipalCount}
        activeLoansCount={activeLoansCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Summaries for Remittance & Receipts */}
        {activeTab === 'home' && (
          <HomeDashboard
            receipts={receipts}
            onOpenSettlement={(type) => {
              setSettlementType(type);
              setIsSettlementOpen(true);
            }}
            onStartTransaction={(type) => {
              setUploadTransferType(type);
              setIsUploadOpen(true);
            }}
          />
        )}

        {activeTab === 'receipts' && (
          <SummaryMetrics
            receipts={receipts}
            onOpenSettlement={(type) => {
              setSettlementType(type);
              setIsSettlementOpen(true);
            }}
          />
        )}

        {/* Tab Content */}
        {activeTab === 'receipts' && (
          <ReceiptsTable
            receipts={receipts}
            selectedReceiptIds={selectedReceiptIds}
            onToggleSelect={handleToggleSelect}
            onSelectAllOutstanding={handleSelectAllOutstanding}
            onClearSelection={handleClearSelection}
            onViewReceipt={(r) => setViewingReceipt(r)}
            onSingleSettle={handleSingleSettle}
            onDeleteReceipt={handleDeleteReceipt}
          />
        )}

        {activeTab === 'settlements' && (
          <SettlementHistoryLedger
            settlements={settlements}
            receipts={receipts}
            onOpenSettlement={() => {
              setSettlementType('PRINCIPAL');
              setIsSettlementOpen(true);
            }}
          />
        )}

        {activeTab === 'rates' && (
          <RatesCalculatorView
            settings={settings}
            onUpdateSettings={setSettings}
            receipts={receipts}
            onOpenUpload={() => setIsUploadOpen(true)}
            manualSendFeeTiers={manualSendFeeTiers}
          />
        )}

        {activeTab === 'loans' && (
          <MoneyLentView
            loans={loans}
            onAddLoan={handleAddLoan}
            onDeleteLoan={handleDeleteLoan}
            onToggleStatus={handleToggleLoanStatus}
            onRecordPayment={handleRecordLoanPayment}
          />
        )}
      </main>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAddReceipt={handleAddReceipt}
        settings={settings}
        initialTransferType={uploadTransferType}
        manualSendFeeTiers={manualSendFeeTiers}
        onUpdateManualSendFeeTiers={setManualSendFeeTiers}
      />

      <SettlementModal
        isOpen={isSettlementOpen}
        onClose={() => setIsSettlementOpen(false)}
        receipts={receipts}
        selectedReceiptIds={selectedReceiptIds}
        initialType={settlementType}
        onExecuteSettlement={handleExecuteSettlement}
      />

      <ReceiptDetailModal
        receipt={viewingReceipt}
        isOpen={!!viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        onSettle={handleSingleSettle}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
      />
    </div>
  );
}
