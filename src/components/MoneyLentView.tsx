import React, { useState } from 'react';
import { 
  HandCoins, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  Mail, 
  CreditCard, 
  Calendar, 
  User, 
  DollarSign, 
  FileText,
  X,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { LoanPayment, MoneyLentRecord, LoanStatus } from '../types';
import { formatCurrency } from '../utils/financialCalculations';
import { getLoanRemainingBalance } from '../utils/loanCalculations';
import { printTable } from '../utils/printTable';

interface MoneyLentViewProps {
  loans: MoneyLentRecord[];
  onAddLoan: (loan: MoneyLentRecord) => void;
  onDeleteLoan: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onRecordPayment: (loanId: string, payment: LoanPayment) => void;
}

export const MoneyLentView: React.FC<MoneyLentViewProps> = ({
  loans,
  onAddLoan,
  onDeleteLoan,
  onToggleStatus,
  onRecordPayment,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REPAID'>('ALL');
  const [isRecipientSuggestionsOpen, setIsRecipientSuggestionsOpen] = useState(false);
  const [selectedRecipientName, setSelectedRecipientName] = useState('');

  // Form state
  const [recipientName, setRecipientName] = useState('');
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<'UGX' | 'DZD' | 'USD' | 'EUR'>('UGX');
  const [idDocumentNumber, setIdDocumentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [paymentLoan, setPaymentLoan] = useState<MoneyLentRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const recipientSuggestions = [...loans]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .filter((loan, index, sortedLoans) => {
      const normalizedName = loan.recipientName.trim().toLocaleLowerCase();
      return (
        normalizedName &&
        sortedLoans.findIndex(
          (candidate) => candidate.recipientName.trim().toLocaleLowerCase() === normalizedName
        ) === index &&
        (!recipientName.trim() ||
          normalizedName.includes(recipientName.trim().toLocaleLowerCase()))
      );
    });

  // Statistics
  const activeLoans = loans.filter((l) => l.status === 'ACTIVE');
  const repaidLoans = loans.filter((l) => l.status === 'REPAID');

  const totalActiveUGX = activeLoans
    .filter((l) => l.currency === 'UGX')
    .reduce((sum, l) => sum + getLoanRemainingBalance(l), 0);

  const totalActiveDZD = activeLoans
    .filter((l) => l.currency === 'DZD' || l.currency === 'DA')
    .reduce((sum, l) => sum + getLoanRemainingBalance(l), 0);

  const totalActiveUSD = activeLoans
    .filter((l) => l.currency === 'USD')
    .reduce((sum, l) => sum + getLoanRemainingBalance(l), 0);

  // Filtered loans list
  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.idDocumentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loan.notes && loan.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'ACTIVE') return loan.status === 'ACTIVE';
    if (statusFilter === 'REPAID') return loan.status === 'REPAID';
    return true;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!recipientName.trim()) {
      setFormError('Please enter recipient name');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid amount greater than 0');
      return;
    }
    if (!dateReceived) {
      setFormError('Please select date of receipt of money');
      return;
    }
    if (!idDocumentNumber.trim()) {
      setFormError('Please enter Passport or Carte de séjour number');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid email address');
      return;
    }

    const newLoan: MoneyLentRecord = {
      id: `LOAN-${Date.now().toString().slice(-8)}`,
      recipientName: recipientName.trim(),
      dateReceived,
      amount: parsedAmount,
      currency,
      idDocumentNumber: idDocumentNumber.trim(),
      email: email.trim().toLowerCase(),
      status: 'ACTIVE',
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onAddLoan(newLoan);

    // Reset form
    setRecipientName('');
    setDateReceived(new Date().toISOString().split('T')[0]);
    setAmount('');
    setIdDocumentNumber('');
    setEmail('');
    setNotes('');
    setSelectedRecipientName('');
    setShowAddForm(false);
  };

  const handleSelectRecipient = (loan: MoneyLentRecord) => {
    setRecipientName(loan.recipientName);
    setSelectedRecipientName(loan.recipientName);
    setIdDocumentNumber(loan.idDocumentNumber);
    setEmail(loan.email);
    setIsRecipientSuggestionsOpen(false);
  };

  const handlePaymentSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!paymentLoan) return;

    const parsedAmount = Number(paymentAmount);
    const remainingBalance = getLoanRemainingBalance(paymentLoan);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setPaymentError('Enter a payment amount greater than 0.');
      return;
    }
    if (parsedAmount > remainingBalance) {
      setPaymentError(`Payment cannot exceed the remaining balance of ${formatCurrency(remainingBalance, paymentLoan.currency)}.`);
      return;
    }
    if (!paymentDate) {
      setPaymentError('Select the date the payment was received.');
      return;
    }

    onRecordPayment(paymentLoan.id, {
      id: `PAY-${Date.now()}`,
      amount: parsedAmount,
      paidAt: paymentDate,
      notes: paymentNotes.trim() || undefined,
    });
    setPaymentLoan(null);
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('');
    setPaymentError(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Summary metrics banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Money Lent in UGX */}
        <div className="bg-white rounded-xl border border-amber-200/90 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <HandCoins className="h-4 w-4 text-amber-600" />
              Active Loans (UGX)
            </span>
            <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              {activeLoans.filter((l) => l.currency === 'UGX').length} Active
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatCurrency(totalActiveUGX, 'UGX')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Lent out to recipients awaiting recovery
          </div>
        </div>

        {/* Active Money Lent in DZD / Other */}
        <div className="bg-white rounded-xl border border-blue-200/90 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-blue-600" />
              Active Loans (DZD / USD)
            </span>
            <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              {activeLoans.filter((l) => l.currency !== 'UGX').length} Active
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatCurrency(totalActiveDZD, 'DZD')}
            {totalActiveUSD > 0 && ` + $${totalActiveUSD}`}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Foreign currency operational advances
          </div>
        </div>

        {/* Repaid & Total Portfolio */}
        <div className="bg-white rounded-xl border border-emerald-200/90 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Total Borrowers Tracked
            </span>
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              {loans.length} Records
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {repaidLoans.length} Repaid <span className="text-sm font-normal text-slate-500">/ {loans.length} Total</span>
          </div>
          <div className="text-xs text-emerald-700 mt-1 flex items-center justify-between">
            <span>Staff internal recovery ledger</span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
            >
              {showAddForm ? 'Hide Form' : '+ New Loan'}
            </button>
          </div>
        </div>
      </div>

      {/* Form to Create Loan Records */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-indigo-200 shadow-md p-6 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <HandCoins className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Record Money Lent to Recipient</h3>
                <p className="text-xs text-slate-500">
                  Fill in borrower details, passport / carte de séjour, amount, and date of receipt
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Recipient Name */}
              <div className="relative">
                <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Name of Recipient <span className="text-rose-500">*</span>
                </label>
                <input
                  id="loan-recipient-name"
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="e.g. Jean Dupont or Fatima Zahra"
                  value={recipientName}
                  onFocus={() => setIsRecipientSuggestionsOpen(true)}
                  onChange={(e) => {
                    const nextName = e.target.value;
                    setRecipientName(nextName);
                    if (
                      selectedRecipientName &&
                      nextName.trim().toLocaleLowerCase() !==
                        selectedRecipientName.trim().toLocaleLowerCase()
                    ) {
                      setSelectedRecipientName('');
                      setIdDocumentNumber('');
                      setEmail('');
                    }
                    setIsRecipientSuggestionsOpen(true);
                  }}
                  aria-expanded={isRecipientSuggestionsOpen && recipientSuggestions.length > 0}
                  aria-controls="loan-recipient-suggestions"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                {isRecipientSuggestionsOpen && recipientSuggestions.length > 0 && (
                  <div
                    id="loan-recipient-suggestions"
                    role="listbox"
                    aria-label="Existing recipients"
                    className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                  >
                    {recipientSuggestions.map((loan) => (
                      <button
                        key={loan.id}
                        type="button"
                        role="option"
                        aria-selected={false}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSelectRecipient(loan)}
                        className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-indigo-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-slate-800">
                            {loan.recipientName}
                          </span>
                          <span className="block truncate text-[11px] text-slate-500">
                            {loan.email} · {loan.idDocumentNumber}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            loan.status === 'ACTIVE'
                              ? 'bg-amber-100 text-amber-800'
                              : loan.status === 'REPAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          Latest: {loan.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-[11px] text-slate-500">
                  Select an existing recipient to reuse their contact details. Enter the new loan amount and purpose below.
                </p>
              </div>

              {/* Date of Receipt of Money */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Date of Receipt of Money <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dateReceived}
                  onChange={(e) => setDateReceived(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                />
              </div>

              {/* Amount and Currency */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                  Amount &amp; Currency <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 150000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-bold"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="w-24 px-2 py-2 rounded-lg border border-slate-300 bg-white font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="UGX">UGX</option>
                    <option value="DZD">DZD (DA)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              {/* Passport / Cartsejue number */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                  Passport / Carte de séjour Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS-DZ-9948201 or P-UGA-10294"
                  value={idDocumentNumber}
                  onChange={(e) => setIdDocumentNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden uppercase"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  Recipient Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. recipient@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Notes / Purpose */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  Loan Purpose / Staff Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bridging advance before payout"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save Loan Record</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loan Records List & Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[240px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, passport/carte de séjour, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({loans.length})
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active Outstanding ({activeLoans.length})
              </button>
              <button
                onClick={() => setStatusFilter('REPAID')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === 'REPAID'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Repaid ({repaidLoans.length})
              </button>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Loan Record</span>
              </button>
            )}

            <button
              onClick={() => printTable('loans')}
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto" data-print-table="loans">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Date Received</th>
                <th className="py-3 px-3">Recipient Name</th>
                <th className="py-3 px-3">Passport / Carte de séjour #</th>
                <th className="py-3 px-3">Email Address</th>
                <th className="py-3 px-3 text-right">Amount / Balance</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">Staff Notes</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <HandCoins className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No money lent records found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Use the &quot;Add Loan Record&quot; button to record people you lent money to.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => (
                  <tr
                    key={loan.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Date Received */}
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{loan.dateReceived}</span>
                      </div>
                    </td>

                    {/* Recipient Name */}
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-indigo-600" />
                        <span>{loan.recipientName}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">{loan.id}</div>
                    </td>

                    {/* Passport / Carte de séjour */}
                    <td className="py-3 px-3">
                      <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        {loan.idDocumentNumber}
                      </span>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-3">
                      <a
                        href={`mailto:${loan.email}`}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 font-medium"
                      >
                        <Mail className="h-3 w-3 text-slate-400" />
                        <span>{loan.email}</span>
                      </a>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-black text-slate-900 text-sm">
                        {formatCurrency(loan.amount, loan.currency)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Remaining: {formatCurrency(getLoanRemainingBalance(loan), loan.currency)}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onToggleStatus(loan.id)}
                        type="button"
                        className="cursor-pointer"
                        title="Click to toggle status (Active vs Repaid)"
                      >
                        {loan.status === 'REPAID' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 transition-colors">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            REPAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors">
                            <Clock className="h-3 w-3 text-amber-600" />
                            ACTIVE
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Notes */}
                    <td className="py-3 px-3 text-slate-500 max-w-[240px]">
                      <div className="break-words">{loan.notes || <span className="text-slate-300">—</span>}</div>
                      {loan.loanHistory && loan.loanHistory.length > 1 && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-[11px] font-semibold text-indigo-600">
                            Previous loans ({loan.loanHistory.length - 1})
                          </summary>
                          <ul className="mt-1 space-y-1">
                            {loan.loanHistory.slice(0, -1).map((previousLoan) => (
                              <li key={previousLoan.id} className="text-[11px] text-slate-600">
                                <span className="font-semibold">
                                  {previousLoan.dateReceived} · {previousLoan.id} ·{' '}
                                  {formatCurrency(previousLoan.amount, previousLoan.currency)}
                                </span>
                                <span className="block break-words">
                                  {previousLoan.notes || 'No staff notes recorded'}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                      {loan.payments && loan.payments.length > 0 && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-[11px] font-semibold text-indigo-600">
                            Payment history ({loan.payments.length})
                          </summary>
                          <ul className="mt-1 space-y-1">
                            {loan.payments.map((payment) => (
                              <li key={payment.id} className="text-[11px] text-slate-600">
                                {payment.paidAt}: {formatCurrency(payment.amount, loan.currency)}
                                {payment.notes ? ` · ${payment.notes}` : ''}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {loan.status === 'ACTIVE' && getLoanRemainingBalance(loan) > 0 && (
                          <button
                            onClick={() => {
                              setPaymentLoan(loan);
                              setPaymentAmount('');
                              setPaymentDate(new Date().toISOString().split('T')[0]);
                              setPaymentNotes('');
                              setPaymentError(null);
                            }}
                            type="button"
                            className="px-2 py-1 rounded text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                          >
                            Record Payment
                          </button>
                        )}
                        <button
                          onClick={() => onToggleStatus(loan.id)}
                          type="button"
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                            loan.status === 'ACTIVE'
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                              : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                          }`}
                          title={loan.status === 'ACTIVE' ? 'Mark this loan as Repaid' : 'Mark back as Active'}
                        >
                          {loan.status === 'ACTIVE' ? 'Mark Repaid' : 'Reactivate'}
                        </button>

                        <button
                          onClick={() => onDeleteLoan(loan.id)}
                          type="button"
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete loan record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between">
          <span>
            Showing {filteredLoans.length} of {loans.length} loan records
          </span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span> Active Loan
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Repaid
            </span>
          </div>
        </div>
      </div>

      {paymentLoan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPaymentLoan(null);
          }}
        >
          <form
            onSubmit={handlePaymentSubmit}
            className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-payment-title"
          >
            <div>
              <h3 id="record-payment-title" className="text-base font-bold text-slate-900">
                Record Payment
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {paymentLoan.recipientName} · Remaining balance:{' '}
                <span className="font-bold text-slate-700">
                  {formatCurrency(getLoanRemainingBalance(paymentLoan), paymentLoan.currency)}
                </span>
              </p>
            </div>

            {paymentError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                {paymentError}
              </div>
            )}

            <label className="block text-xs font-semibold text-slate-700">
              Payment amount ({paymentLoan.currency})
              <input
                type="number"
                min="0.01"
                max={getLoanRemainingBalance(paymentLoan)}
                step="0.01"
                required
                autoFocus
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-700">
              Date received
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-700">
              Payment note (optional)
              <input
                type="text"
                value={paymentNotes}
                onChange={(event) => setPaymentNotes(event.target.value)}
                placeholder="e.g. Cash installment"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setPaymentLoan(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Save Payment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
