import type { FinanceBackupData, FinanceBackupSnapshot } from '../types';


const SNAPSHOT_VERSION = '1.0.0';


export const createBackupSnapshot = (data: FinanceBackupData): FinanceBackupSnapshot => ({
  version: SNAPSHOT_VERSION,
  exportedAt: new Date().toISOString(),
  app: 'FinDash',
  data,
});

export const isValidBackupSnapshot = (value: unknown): value is FinanceBackupSnapshot => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<FinanceBackupSnapshot>;
  if (!candidate.data || typeof candidate.data !== 'object') return false;
  const data = candidate.data as Partial<FinanceBackupData>;

  return (
    typeof candidate.version === 'string'
    && typeof candidate.exportedAt === 'string'
    && typeof candidate.app === 'string'
    && Array.isArray(data.transactions)
    && Array.isArray(data.categories)
    && Array.isArray(data.recurringTransactions)
    && Array.isArray(data.categoryBudgets)
    && !!data.config
    && Array.isArray(data.contas)
    && Array.isArray(data.cartoesCredito)
    && Array.isArray(data.faturaStatuses)
    && Array.isArray(data.loans)
  );
};



