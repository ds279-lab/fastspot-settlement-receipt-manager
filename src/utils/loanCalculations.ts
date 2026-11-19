import { LoanHistoryEntry, LoanPayment, LoanStatus, MoneyLentRecord } from '../types';

export const getLoanRemainingBalance = (loan: MoneyLentRecord): number => {
  const paidAmount = (loan.payments ?? []).reduce((total, payment) => total + payment.amount, 0);
  return Math.max(0, Math.round((loan.amount - paidAmount) * 100) / 100);
};

const getLoanDate = (loan: Pick<MoneyLentRecord, 'dateReceived' | 'createdAt'>) =>
  `${loan.createdAt}T${loan.dateReceived}`;

const normalizeCurrency = (currency: string) =>
  currency.toUpperCase() === 'DA' ? 'DZD' : currency.toUpperCase();

const toLoanHistoryEntry = (loan: MoneyLentRecord): LoanHistoryEntry => ({
  id: loan.id,
  dateReceived: loan.dateReceived,
  amount: loan.amount,
  currency: loan.currency,
  notes: loan.notes,
  status: loan.status,
  createdAt: loan.createdAt,
});

export const mergeLoansByRecipientAndCurrency = (
  loans: MoneyLentRecord[]
): MoneyLentRecord[] => {
  const groupedLoans = new Map<string, MoneyLentRecord[]>();

  for (const loan of loans) {
    const key = `${loan.recipientName.trim().toLocaleLowerCase()}|${normalizeCurrency(loan.currency)}`;
    const group = groupedLoans.get(key) ?? [];
    group.push(loan);
    groupedLoans.set(key, group);
  }

  return Array.from(groupedLoans.values(), (group) => {
    const newestFirst = [...group].sort((a, b) => getLoanDate(b).localeCompare(getLoanDate(a)));
    const latestLoan = newestFirst[0];
    const history = group
      .flatMap((loan) => loan.loanHistory ?? [toLoanHistoryEntry(loan)])
      .sort((a, b) => getLoanDate(a).localeCompare(getLoanDate(b)));
    const payments: LoanPayment[] = group.flatMap((loan) => {
      const existingPayments = loan.payments ?? [];
      const unrecordedRepaidBalance =
        loan.status === 'REPAID' ? getLoanRemainingBalance(loan) : 0;
      if (unrecordedRepaidBalance <= 0) return existingPayments;

      return [
        ...existingPayments,
        {
          id: `LEGACY-REPAID-${loan.id}`,
          amount: unrecordedRepaidBalance,
          paidAt: loan.dateReceived,
          notes: 'Previously marked repaid; payment date not recorded',
        },
      ];
    });
    const mergedAmount = group.reduce((total, loan) => total + loan.amount, 0);
    const mergedLoan: MoneyLentRecord = {
      ...latestLoan,
      id: history[history.length - 1]?.id ?? latestLoan.id,
      dateReceived: history[history.length - 1]?.dateReceived ?? latestLoan.dateReceived,
      amount: Math.round(mergedAmount * 100) / 100,
      currency: history[history.length - 1]?.currency ?? latestLoan.currency,
      notes: history[history.length - 1]?.notes ?? '',
      status: latestLoan.status,
      payments,
      loanHistory: history,
      createdAt: history[history.length - 1]?.createdAt ?? latestLoan.createdAt,
    };
    const remainingBalance = getLoanRemainingBalance(mergedLoan);
    const status: LoanStatus =
      remainingBalance === 0
        ? 'REPAID'
        : group.some((loan) => loan.status === 'ACTIVE')
          ? 'ACTIVE'
          : group.some((loan) => loan.status === 'DEFAULTED')
            ? 'DEFAULTED'
            : 'ACTIVE';

    return {
      ...mergedLoan,
      status,
    };
  }).sort((a, b) => getLoanDate(b).localeCompare(getLoanDate(a)));
};
