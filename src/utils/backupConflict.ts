import type { FinanceBackupData } from '../types';

export type ConflictWinner = 'local' | 'remote';

const toTime = (value?: string | null): number => (value ? Date.parse(value) : Number.NaN);

/** Indica se o dispositivo ainda não tem nenhum dado financeiro cadastrado pelo usuário. */
export const isLocalDataEmpty = (data: FinanceBackupData): boolean =>
  data.transactions.length === 0
  && data.contas.length === 0
  && data.cartoesCredito.length === 0
  && data.loans.length === 0
  && (data.debts?.length ?? 0) === 0
  && (data.debtPayments?.length ?? 0) === 0
  && data.goals.length === 0
  && data.recurringTransactions.length === 0
  && data.categoryBudgets.length === 0;

/**
 * Regra determinística: o mais recente vence; em empate, vence o local.
 * - Remoto com data inválida: mantém o local.
 * - Local sem dados: o remoto vence (dispositivo novo).
 * - Local com dados, mas sem data de alteração conhecida: mantém o local para não perder dados.
 */
export const resolveConflict = (
  localUpdatedAt: string | null,
  remoteExportedAt: string,
  localIsEmpty = false,
): ConflictWinner => {
  const remote = toTime(remoteExportedAt);
  if (Number.isNaN(remote)) return 'local';
  if (localIsEmpty) return 'remote';

  const local = toTime(localUpdatedAt);
  if (Number.isNaN(local)) return 'local';

  return remote > local ? 'remote' : 'local';
};
