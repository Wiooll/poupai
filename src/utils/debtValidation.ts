import { parseISO } from 'date-fns';
import type { Debt } from '../types';
import { roundMoney } from './debtCalculations';

export type DebtInput = Omit<Debt, 'id' | 'createdAt' | 'updatedAt' | 'status'>;

export const validateDebtInput = (debt: DebtInput): string => {
  if (!debt.descricao || debt.descricao.trim().length < 3) {
    return 'Informe uma descrição com pelo menos 3 caracteres.';
  }
  if (!debt.credor || debt.credor.trim().length < 2) {
    return 'Informe o credor (a quem você deve).';
  }
  if (!Number.isFinite(Number(debt.valorTotal)) || Number(debt.valorTotal) <= 0) {
    return 'Informe um valor total maior que zero.';
  }
  if (debt.vencimento && Number.isNaN(parseISO(debt.vencimento).getTime())) {
    return 'Informe um vencimento válido.';
  }
  return '';
};

export const validateDebtPayment = (
  input: { valor: number; data: string; contaId: string },
  remaining: number,
): string => {
  if (!input.contaId) {
    return 'Selecione a conta que fará o pagamento.';
  }
  if (!input.data || Number.isNaN(parseISO(input.data).getTime())) {
    return 'Informe uma data válida para o pagamento.';
  }
  const valor = Number(input.valor);
  if (!Number.isFinite(valor) || valor <= 0) {
    return 'Informe um valor de pagamento maior que zero.';
  }
  if (roundMoney(valor) > roundMoney(remaining)) {
    return 'O valor do pagamento não pode ser maior que o saldo restante da dívida.';
  }
  return '';
};
