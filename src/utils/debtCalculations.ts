import { parseISO, startOfDay } from 'date-fns';
import type { Debt, DebtPayment, DebtStatus } from '../types';

/** Arredonda para 2 casas para evitar resíduos de ponto flutuante nos centavos. */
export const roundMoney = (value: number): number => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const getDebtPaidTotal = (debtId: string, payments: DebtPayment[]): number =>
  roundMoney(
    payments.filter((payment) => payment.debtId === debtId).reduce((sum, p) => sum + Number(p.valor), 0),
  );

/** Saldo restante = valor total - soma dos pagamentos (nunca negativo). */
export const getDebtRemaining = (debt: Pick<Debt, 'id' | 'valorTotal'>, payments: DebtPayment[]): number =>
  Math.max(0, roundMoney(Number(debt.valorTotal) - getDebtPaidTotal(debt.id, payments)));

export const getDebtStatus = (debt: Pick<Debt, 'id' | 'valorTotal'>, payments: DebtPayment[]): DebtStatus => {
  const paid = getDebtPaidTotal(debt.id, payments);
  if (paid <= 0) return 'pendente';
  return getDebtRemaining(debt, payments) <= 0 ? 'quitada' : 'parcial';
};

/** Vencida = não quitada e com vencimento anterior a hoje. Valor derivado, não gravado. */
export const isDebtOverdue = (debt: Pick<Debt, 'vencimento' | 'status'>, today: Date = new Date()): boolean => {
  if (debt.status === 'quitada' || !debt.vencimento) return false;
  const due = parseISO(debt.vencimento);
  if (Number.isNaN(due.getTime())) return false;
  return startOfDay(due) < startOfDay(today);
};

/** Soma dos saldos restantes das dívidas não quitadas. */
export const getTotalOwed = (debts: Debt[], payments: DebtPayment[]): number =>
  roundMoney(
    debts
      .filter((debt) => debt.status !== 'quitada')
      .reduce((sum, debt) => sum + getDebtRemaining(debt, payments), 0),
  );
