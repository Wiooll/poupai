import { describe, expect, it } from 'vitest';
import { createBackupSnapshot, isValidBackupSnapshot } from './localPersistence';
import type { FinanceBackupData } from '../types';

const mockData: FinanceBackupData = {
  transactions: [],
  categories: [],
  recurringTransactions: [],
  categoryBudgets: [],
  config: { metaEconomiaMensal: 1000, isDarkMode: false, themeMode: 'white' },
  contas: [],
  cartoesCredito: [],
  faturaStatuses: [],
  loans: [],
  goals: [],
};

describe('localPersistence', () => {
  it('cria snapshot válido', () => {
    const snapshot = createBackupSnapshot(mockData);
    expect(isValidBackupSnapshot(snapshot)).toBe(true);
  });

  it('invalida snapshot sem estrutura esperada', () => {
    expect(isValidBackupSnapshot({ foo: 'bar' })).toBe(false);
  });
});

