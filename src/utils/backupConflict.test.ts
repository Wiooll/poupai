import { describe, expect, it } from 'vitest';
import { isLocalDataEmpty, resolveConflict } from './backupConflict';
import type { FinanceBackupData } from '../types';

const emptyData: FinanceBackupData = {
  transactions: [],
  categories: [],
  recurringTransactions: [],
  categoryBudgets: [],
  config: { metaEconomiaMensal: 1000, isDarkMode: false },
  contas: [],
  cartoesCredito: [],
  faturaStatuses: [],
  loans: [],
  goals: [],
};

describe('resolveConflict', () => {
  it('remoto mais recente vence', () => {
    expect(resolveConflict('2026-01-01T10:00:00.000Z', '2026-01-02T10:00:00.000Z')).toBe('remote');
  });

  it('local mais recente vence', () => {
    expect(resolveConflict('2026-01-03T10:00:00.000Z', '2026-01-02T10:00:00.000Z')).toBe('local');
  });

  it('empate mantém o local', () => {
    expect(resolveConflict('2026-01-02T10:00:00.000Z', '2026-01-02T10:00:00.000Z')).toBe('local');
  });

  it('remoto com data inválida mantém o local', () => {
    expect(resolveConflict('2026-01-02T10:00:00.000Z', 'invalida')).toBe('local');
  });

  it('dispositivo sem dados aceita o remoto', () => {
    expect(resolveConflict('2026-01-05T10:00:00.000Z', '2026-01-02T10:00:00.000Z', true)).toBe('remote');
  });

  it('local com dados e sem data conhecida preserva o local', () => {
    expect(resolveConflict(null, '2026-01-02T10:00:00.000Z')).toBe('local');
  });
});

describe('isLocalDataEmpty', () => {
  it('considera vazio quando não há dados do usuário', () => {
    expect(isLocalDataEmpty(emptyData)).toBe(true);
  });

  it('não considera vazio quando há metas', () => {
    const data = { ...emptyData, goals: [{ id: 'g1' } as FinanceBackupData['goals'][number]] };
    expect(isLocalDataEmpty(data)).toBe(false);
  });
});
