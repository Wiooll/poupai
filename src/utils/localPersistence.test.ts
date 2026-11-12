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

  it('grava o nome PoupAi nos novos backups', () => {
    expect(createBackupSnapshot(mockData).app).toBe('PoupAi');
  });

  it('aceita backup antigo gerado como FinDash', () => {
    const legado = { ...createBackupSnapshot(mockData), app: 'FinDash' };
    expect(isValidBackupSnapshot(legado)).toBe(true);
  });

  it('invalida snapshot sem estrutura esperada', () => {
    expect(isValidBackupSnapshot({ foo: 'bar' })).toBe(false);
  });
});

