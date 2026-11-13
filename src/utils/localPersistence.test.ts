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

  it('aceita backup antigo sem debts e debtPayments', () => {
    const antigo = createBackupSnapshot(mockData);
    expect(antigo.data.debts).toBeUndefined();
    expect(isValidBackupSnapshot(antigo)).toBe(true);
  });

  it('aceita backup novo com debts e debtPayments', () => {
    const novo = createBackupSnapshot({ ...mockData, debts: [], debtPayments: [] });
    expect(isValidBackupSnapshot(novo)).toBe(true);
  });

  it('invalida backup com debts que não é lista', () => {
    const invalido = createBackupSnapshot({ ...mockData, debts: 'x' as unknown as [] });
    expect(isValidBackupSnapshot(invalido)).toBe(false);
  });

  it('invalida snapshot sem estrutura esperada', () => {
    expect(isValidBackupSnapshot({ foo: 'bar' })).toBe(false);
  });
});

