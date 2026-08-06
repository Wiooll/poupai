import Dexie, { type Table } from 'dexie';
import type {
  Transaction,
  Categoria,
  Conta,
  CartaoCredito,
  FaturaStatus,
  RecurringTransaction,
  CategoryBudget,
  Loan,
  Goal,
  AppConfig
} from '../types';

export class FinDashDatabase extends Dexie {
  transactions!: Table<Transaction, string>;
  categories!: Table<Categoria, string>;
  contas!: Table<Conta, string>;
  cartoesCredito!: Table<CartaoCredito, string>;
  faturaStatuses!: Table<FaturaStatus, string>;
  recurringTransactions!: Table<RecurringTransaction, string>;
  categoryBudgets!: Table<CategoryBudget, string>;
  loans!: Table<Loan, string>;
  goals!: Table<Goal, string>;
  config!: Table<AppConfig & { id: string }, string>;

  constructor() {
    super('FinDashDB');
    this.version(1).stores({
      transactions: 'id, data, categoria, tipo, formaPagamento, contaId, cartaoId',
      categories: 'id, nome, tipo',
      contas: 'id, tipo',
      cartoesCredito: 'id, contaDebitoId',
      faturaStatuses: 'id, cartaoId, anoMes, status',
      recurringTransactions: 'id, active',
      categoryBudgets: 'id, categoryId',
      loans: 'id, status',
      goals: 'id',
      config: 'id'
    });
  }
}

export const db = new FinDashDatabase();
