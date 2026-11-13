/* eslint-disable react-refresh/only-export-components, react-hooks/exhaustive-deps */
import { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { APP_NAME } from '../constants/app';
import { db } from '../services/db';
import type {
  AppConfig,
  FinanceBackupData,
  FinanceBackupSnapshot,
  CartaoCredito,
  Categoria,
  CategoryBudget,
  Conta,
  Debt,
  DebtPayment,
  FaturaInfo,
  FaturaStatus,
  Goal,
  Loan,
  LoanStatus,
  RecurrenceFrequency,
  RecurringTransaction,
  ThemeMode,
  Transaction,
} from '../types';
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  isAfter,
  parseISO,
  startOfDay,
  setDate,
} from 'date-fns';
import { v4 as uuid } from 'uuid';
import { getDebtPaidTotal, getDebtStatus, roundMoney } from '../utils/debtCalculations';
import { validateDebtInput, validateDebtPayment, type DebtInput } from '../utils/debtValidation';

export const DEBT_PAYMENT_CATEGORY = 'Pagamento de Dívida';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Categoria[];
  recurringTransactions: RecurringTransaction[];
  categoryBudgets: CategoryBudget[];
  config: AppConfig;
  contas: Conta[];
  cartoesCredito: CartaoCredito[];
  faturaStatuses: FaturaStatus[];
  loans: Loan[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  goals: Goal[];
  /** `true` quando todas as leituras iniciais do banco local terminaram. */
  isDataLoaded: boolean;

  addGoal: (g: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateGoal: (id: string, g: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, t: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addParcelado: (
    base: Omit<Transaction, 'id' | 'parcelaAtual' | 'totalParcelas' | 'parcelaGrupoId'>,
    totalParcelas: number,
  ) => Promise<void>;

  transferir: (params: {
    contaOrigemId: string;
    contaDestinoId: string;
    valor: number;
    data: string;
    descricao?: string;
  }) => Promise<void>;

  addCategory: (c: Omit<Categoria, 'id'>) => Promise<void>;
  updateCategory: (id: string, c: Partial<Categoria>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  addRecurringTransaction: (r: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRecurringTransaction: (id: string, r: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  toggleRecurringTransaction: (id: string, active: boolean) => Promise<void>;

  upsertCategoryBudget: (categoryId: string, monthlyLimit: number) => Promise<void>;
  deleteCategoryBudget: (id: string) => Promise<void>;

  updateConfig: (c: Partial<AppConfig>) => Promise<void>;
  setThemeMode: (themeMode: ThemeMode) => Promise<void>;

  addConta: (c: Omit<Conta, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateConta: (id: string, c: Partial<Conta>) => Promise<void>;
  deleteConta: (id: string) => Promise<void>;

  addCartaoCredito: (c: Omit<CartaoCredito, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCartaoCredito: (id: string, c: Partial<CartaoCredito>) => Promise<void>;
  deleteCartaoCredito: (id: string) => Promise<void>;

  addLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLoan: (id: string, loan: Partial<Loan>) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  updateLoanStatus: (id: string, status: LoanStatus) => Promise<void>;

  addDebt: (debt: DebtInput) => Promise<void>;
  updateDebt: (id: string, debt: Partial<DebtInput>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  payDebt: (debtId: string, payment: { valor: number; data: string; contaId: string }) => Promise<void>;
  deleteDebtPayment: (paymentId: string) => Promise<void>;

  pagarFatura: (cartaoId: string, anoMes: string) => Promise<void>;

  getSaldoConta: (contaId: string) => number;
  getFaturasInfo: (anoMesParam?: string) => FaturaInfo[];
  getLimiteDisponivel: (cartaoId: string) => number;
  getBackupSnapshot: () => FinanceBackupSnapshot;
  restoreBackupSnapshot: (snapshot: FinanceBackupSnapshot) => Promise<void>;
}

const defaultCategories: Categoria[] = [
  { id: '1', nome: 'Alimentação', tipo: 'despesa' },
  { id: '2', nome: 'Transporte', tipo: 'despesa' },
  { id: '3', nome: 'Moradia', tipo: 'despesa' },
  { id: '4', nome: 'Lazer', tipo: 'despesa' },
  { id: '5', nome: 'Saúde', tipo: 'despesa' },
  { id: '6', nome: 'Salário', tipo: 'receita' },
  { id: '7', nome: 'Investimentos', tipo: 'ambos' },
];

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const nextDateByFrequency = (date: Date, frequency: RecurrenceFrequency) => {
  if (frequency === 'diaria') return addDays(date, 1);
  if (frequency === 'semanal') return addWeeks(date, 1);
  if (frequency === 'mensal') return addMonths(date, 1);
  return addYears(date, 1);
};

const createRecurringTransactionId = (ruleId: string, date: string) => {
  const compactDate = date.replace(/-/g, '');
  return `rec_${ruleId}_${compactDate}`;
};

export const calcularPeriodoFatura = (
  cartao: CartaoCredito,
  anoMes: string,
): { inicio: Date; fim: Date; dataFechamento: Date; dataVencimento: Date } => {
  const [ano, mes] = anoMes.split('-').map(Number);
  const dataFechamento = setDate(new Date(ano, mes - 1, 1), cartao.diaFechamento);

  const mesAnterior = addMonths(dataFechamento, -1);
  const inicio = addDays(setDate(mesAnterior, cartao.diaFechamento), 1);
  const fim = dataFechamento;

  const dataVencimento = setDate(addMonths(dataFechamento, 1), cartao.diaVencimento);

  return { inicio, fim, dataFechamento, dataVencimento };
};

const getAnoMesFaturaByTransactionDate = (cartao: CartaoCredito, dataTransacao: Date): string => {
  const data = startOfDay(dataTransacao);
  const fechamentoNoMesDaCompra = setDate(
    new Date(data.getFullYear(), data.getMonth(), 1),
    cartao.diaFechamento,
  );
  if (data <= fechamentoNoMesDaCompra) {
    return format(data, 'yyyy-MM');
  }
  return format(addMonths(data, 1), 'yyyy-MM');
};

const stripUndefined = <T extends object>(obj: T): T =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  // `useLiveQuery` retorna `undefined` até a primeira leitura do Dexie terminar.
  const transactionsQuery = useLiveQuery(() => db.transactions.toArray());
  const categoriesQuery = useLiveQuery(() => db.categories.toArray());
  const recurringQuery = useLiveQuery(() => db.recurringTransactions.toArray());
  const categoryBudgetsQuery = useLiveQuery(() => db.categoryBudgets.toArray());
  const contasQuery = useLiveQuery(() => db.contas.toArray());
  const cartoesQuery = useLiveQuery(() => db.cartoesCredito.toArray());
  const faturaStatusesQuery = useLiveQuery(() => db.faturaStatuses.toArray());
  const loansQuery = useLiveQuery(() => db.loans.toArray());
  const debtsQuery = useLiveQuery(() => db.debts.toArray());
  const debtPaymentsQuery = useLiveQuery(() => db.debtPayments.toArray());
  const goalsQuery = useLiveQuery(() => db.goals.toArray());
  const configQuery = useLiveQuery(() => db.config.toArray());

  const isDataLoaded = [
    transactionsQuery,
    categoriesQuery,
    recurringQuery,
    categoryBudgetsQuery,
    contasQuery,
    cartoesQuery,
    faturaStatusesQuery,
    loansQuery,
    debtsQuery,
    debtPaymentsQuery,
    goalsQuery,
    configQuery,
  ].every((result) => result !== undefined);

  const transactions = transactionsQuery || [];
  const categories = categoriesQuery || defaultCategories;
  const recurringTransactions = recurringQuery || [];
  const categoryBudgets = categoryBudgetsQuery || [];
  const contas = contasQuery || [];
  const cartoesCredito = cartoesQuery || [];
  const faturaStatuses = faturaStatusesQuery || [];
  const loans = loansQuery || [];
  const debts = debtsQuery || [];
  const debtPayments = debtPaymentsQuery || [];
  const goals = goalsQuery || [];
  const configArr = configQuery || [];

  const config: AppConfig = configArr.find((c) => c.id === 'main') || {
    metaEconomiaMensal: 1000,
    isDarkMode: false,
    themeMode: 'white',
    aiApiKey: undefined,
    aiProvider: undefined,
    aiModel: undefined,
  };

  const applyTheme = useCallback((themeMode: ThemeMode) => {
    const root = document.documentElement;
    const isDark = themeMode === 'black';
    root.classList.toggle('dark', isDark);
    root.dataset.theme = themeMode;
  }, []);

  // Initialize defaults
  useEffect(() => {
    const initDefaults = async () => {
      const catsCount = await db.categories.count();
      if (catsCount === 0) {
        await db.categories.bulkAdd(defaultCategories);
      }
      const configCount = await db.config.count();
      if (configCount === 0) {
        await db.config.add({
          id: 'main',
          metaEconomiaMensal: 1000,
          isDarkMode: false,
          themeMode: 'white',
          aiApiKey: undefined,
          aiProvider: undefined,
          aiModel: undefined,
        });
      }
    };
    initDefaults();
  }, []);

  useEffect(() => {
    const normalizedTheme = config.themeMode || (config.isDarkMode ? 'black' : 'white');
    applyTheme(normalizedTheme);
  }, [config.themeMode, config.isDarkMode, applyTheme]);

  const transactionsIdSet = useMemo(() => new Set(transactions.map((t) => t.id)), [transactions]);

  const buildCurrentBackupData = useCallback((): FinanceBackupData => ({
    transactions,
    categories,
    recurringTransactions,
    categoryBudgets,
    config,
    contas,
    cartoesCredito,
    faturaStatuses,
    loans,
    goals,
    debts,
    debtPayments,
  }), [
    transactions,
    categories,
    recurringTransactions,
    categoryBudgets,
    config,
    contas,
    cartoesCredito,
    faturaStatuses,
    loans,
    goals,
    debts,
    debtPayments,
  ]);

  // Recurrence Sync
  useEffect(() => {
    if (recurringTransactions.length === 0) return;

    const syncRecurringEntries = async () => {
      const today = startOfDay(new Date());
      const existingIds = new Set(transactionsIdSet);
      const newTransactions: Transaction[] = [];

      for (const rule of recurringTransactions) {
        if (!rule.active) continue;

        const start = startOfDay(parseISO(rule.startDate));
        if (Number.isNaN(start.getTime())) continue;

        const rawEnd = rule.endDate ? startOfDay(parseISO(rule.endDate)) : null;
        if (rawEnd && Number.isNaN(rawEnd.getTime())) continue;

        const endDate = rawEnd && isAfter(rawEnd, today) ? today : rawEnd || today;
        if (isAfter(start, endDate)) continue;

        let cursor = start;
        while (!isAfter(cursor, endDate)) {
          const txDate = format(cursor, 'yyyy-MM-dd');
          const txId = createRecurringTransactionId(rule.id, txDate);

          if (!existingIds.has(txId)) {
            newTransactions.push({
              id: txId,
              data: txDate,
              descricao: rule.descricao,
              categoria: rule.categoria,
              tipo: rule.tipo,
              valor: Number(rule.valor),
              formaPagamento: rule.formaPagamento,
              recurringRuleId: rule.id,
              generatedByRecurrence: true,
            });
            existingIds.add(txId);
          }
          cursor = nextDateByFrequency(cursor, rule.frequency);
        }
      }

      if (newTransactions.length > 0) {
        await db.transactions.bulkAdd(newTransactions);
      }
    };

    syncRecurringEntries();
  }, [recurringTransactions, transactionsIdSet]);

  const getSaldoConta = (contaId: string): number => {
    const conta = contas.find((c) => c.id === contaId);
    if (!conta) return 0;

    let saldo = conta.saldoInicial;
    transactions.forEach((t) => {
      if (t.contaId !== contaId) return;
      if (t.tipo === 'receita') saldo += Number(t.valor);
      else if (t.tipo === 'despesa') saldo -= Number(t.valor);
      else if (t.tipo === 'transferencia') {
        if (t.isTransferenciaOrigem) saldo -= Number(t.valor);
        else saldo += Number(t.valor);
      }
    });
    return saldo;
  };

  const getFaturasInfo = (anoMesParam?: string): FaturaInfo[] => {
    const hoje = new Date();
    const anoMesRef = anoMesParam || format(hoje, 'yyyy-MM');

    return cartoesCredito.map((cartao) => {
      const { inicio, fim, dataFechamento, dataVencimento } = calcularPeriodoFatura(cartao, anoMesRef);

      const txsFatura = transactions.filter((t) => {
        if (t.cartaoId !== cartao.id) return false;
        if (t.tipo !== 'despesa') return false;
        const d = parseISO(t.data);
        return d >= inicio && d <= fim;
      });

      const total = txsFatura.reduce((acc, t) => acc + Number(t.valor), 0);
      const faturaId = `fatura_${cartao.id}_${anoMesRef.replace('-', '')}`;
      const statusReg = faturaStatuses.find(
        (f) => f.cartaoId === cartao.id && f.anoMes === anoMesRef,
      );
      const status = statusReg?.status ?? 'aberta';

      return {
        cartaoId: cartao.id,
        cartaoNome: cartao.nome,
        anoMes: anoMesRef,
        dataFechamento: format(dataFechamento, 'yyyy-MM-dd'),
        dataVencimento: format(dataVencimento, 'yyyy-MM-dd'),
        status,
        total,
        transacoes: txsFatura,
        faturaId,
      } as FaturaInfo & { faturaId: string };
    });
  };

  const getLimiteDisponivel = (cartaoId: string): number => {
    const cartao = cartoesCredito.find((c) => c.id === cartaoId);
    if (!cartao) return 0;
    const usado = transactions.reduce((acc, t) => {
      if (t.cartaoId !== cartaoId) return acc;
      if (t.tipo !== 'despesa') return acc;
      const dataTx = parseISO(t.data);
      if (Number.isNaN(dataTx.getTime())) return acc;
      const anoMesFatura = getAnoMesFaturaByTransactionDate(cartao, dataTx);
      const statusFatura = faturaStatuses.find(
        (f) => f.cartaoId === cartaoId && f.anoMes === anoMesFatura,
      )?.status;
      if (statusFatura === 'paga') return acc;
      return acc + Number(t.valor);
    }, 0);
    return cartao.limite - usado;
  };

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    const newTx = stripUndefined({ ...t, id: uuid() });
    await db.transactions.add(newTx);
  };

  const updateTransaction = async (id: string, t: Partial<Transaction>) => {
    await db.transactions.update(id, stripUndefined(t));
  };

  const deleteTransaction = async (id: string) => {
    await db.transactions.delete(id);
  };

  const addParcelado = async (
    base: Omit<Transaction, 'id' | 'parcelaAtual' | 'totalParcelas' | 'parcelaGrupoId'>,
    totalParcelas: number,
  ) => {
    const grupoId = uuid();
    const dataBase = parseISO(base.data);

    const batch = Array.from({ length: totalParcelas }, (_, i) => {
      const id = uuid();
      const dataVencimento = format(addMonths(dataBase, i), 'yyyy-MM-dd');
      return stripUndefined({
        ...base,
        id,
        data: dataVencimento,
        parcelaAtual: i + 1,
        totalParcelas,
        parcelaGrupoId: grupoId,
        descricao: `${base.descricao} (${i + 1}/${totalParcelas})`,
      });
    });

    await db.transactions.bulkAdd(batch);
  };

  const transferir = async ({
    contaOrigemId,
    contaDestinoId,
    valor,
    data,
    descricao = 'Transferência',
  }: {
    contaOrigemId: string;
    contaDestinoId: string;
    valor: number;
    data: string;
    descricao?: string;
  }) => {
    const idSaida = uuid();
    const idEntrada = uuid();

    const txSaida: Transaction = {
      id: idSaida,
      data,
      descricao,
      categoria: 'Transferência',
      tipo: 'transferencia',
      valor: Number(valor),
      formaPagamento: 'PIX',
      contaId: contaOrigemId,
      isTransferenciaOrigem: true,
      transferenciaPairId: idEntrada,
    };

    const txEntrada: Transaction = {
      id: idEntrada,
      data,
      descricao,
      categoria: 'Transferência',
      tipo: 'transferencia',
      valor: Number(valor),
      formaPagamento: 'PIX',
      contaId: contaDestinoId,
      isTransferenciaOrigem: false,
      transferenciaPairId: idSaida,
    };

    await db.transactions.bulkAdd([txSaida, txEntrada]);
  };

  const addCategory = async (c: Omit<Categoria, 'id'>) => {
    const newCat = stripUndefined({ ...c, id: uuid() });
    await db.categories.add(newCat);
  };

  const updateCategory = async (id: string, c: Partial<Categoria>) => {
    await db.categories.update(id, stripUndefined(c));
  };

  const deleteCategory = async (id: string) => {
    await db.categories.delete(id);
  };

  const addRecurringTransaction = async (
    r: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    const now = new Date().toISOString();
    const recurring: RecurringTransaction = stripUndefined({
      ...r,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    });
    await db.recurringTransactions.add(recurring);
  };

  const updateRecurringTransaction = async (id: string, r: Partial<RecurringTransaction>) => {
    await db.recurringTransactions.update(id, stripUndefined({
      ...r,
      updatedAt: new Date().toISOString(),
    }));
  };

  const deleteRecurringTransaction = async (id: string) => {
    await db.recurringTransactions.delete(id);
  };

  const toggleRecurringTransaction = async (id: string, active: boolean) => {
    await updateRecurringTransaction(id, { active });
  };

  const upsertCategoryBudget = async (categoryId: string, monthlyLimit: number) => {
    const normalizedLimit = Number(monthlyLimit);
    const existing = categoryBudgets.find((budget) => budget.categoryId === categoryId);

    if (existing) {
      await db.categoryBudgets.update(existing.id, {
        monthlyLimit: normalizedLimit,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    const now = new Date().toISOString();
    const budget: CategoryBudget = {
      id: uuid(),
      categoryId,
      monthlyLimit: normalizedLimit,
      createdAt: now,
      updatedAt: now,
    };
    await db.categoryBudgets.add(budget);
  };

  const deleteCategoryBudget = async (id: string) => {
    await db.categoryBudgets.delete(id);
  };

  const updateConfig = async (c: Partial<AppConfig>) => {
    const existing = await db.config.get('main');
    if (existing) {
      await db.config.update('main', stripUndefined(c));
    } else {
      await db.config.add({ id: 'main', metaEconomiaMensal: 1000, isDarkMode: false, themeMode: 'white', ...stripUndefined(c) });
    }
  };

  const setThemeMode = async (themeMode: ThemeMode) => {
    await updateConfig({
      themeMode,
      isDarkMode: themeMode === 'black',
    });
  };

  const addConta = async (c: Omit<Conta, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    await db.contas.add(stripUndefined({ ...c, id: uuid(), createdAt: now, updatedAt: now }));
  };

  const updateConta = async (id: string, c: Partial<Conta>) => {
    await db.contas.update(id, stripUndefined({ ...c, updatedAt: new Date().toISOString() }));
  };

  const deleteConta = async (id: string) => {
    await db.contas.delete(id);
  };

  const addCartaoCredito = async (c: Omit<CartaoCredito, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    await db.cartoesCredito.add(stripUndefined({ ...c, id: uuid(), createdAt: now, updatedAt: now }));
  };

  const updateCartaoCredito = async (id: string, c: Partial<CartaoCredito>) => {
    await db.cartoesCredito.update(id, stripUndefined({ ...c, updatedAt: new Date().toISOString() }));
  };

  const deleteCartaoCredito = async (id: string) => {
    await db.cartoesCredito.delete(id);
  };

  const addLoan = async (loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    await db.loans.add(stripUndefined({ ...loan, id: uuid(), createdAt: now, updatedAt: now }));
  };

  const updateLoan = async (id: string, loan: Partial<Loan>) => {
    await db.loans.update(id, stripUndefined({ ...loan, updatedAt: new Date().toISOString() }));
  };

  const deleteLoan = async (id: string) => {
    await db.loans.delete(id);
  };

  const updateLoanStatus = async (id: string, status: LoanStatus) => {
    await db.loans.update(id, { status, updatedAt: new Date().toISOString() });
  };

  const addDebt = async (debt: DebtInput) => {
    const error = validateDebtInput(debt);
    if (error) throw new Error(error);
    const now = new Date().toISOString();
    await db.debts.add(
      stripUndefined({
        ...debt,
        descricao: debt.descricao.trim(),
        credor: debt.credor.trim(),
        valorTotal: roundMoney(Number(debt.valorTotal)),
        id: uuid(),
        status: 'pendente' as const,
        createdAt: now,
        updatedAt: now,
      }),
    );
  };

  const updateDebt = async (id: string, patch: Partial<DebtInput>) => {
    await db.transaction('rw', db.debts, db.debtPayments, async () => {
      const current = await db.debts.get(id);
      if (!current) throw new Error('Dívida não encontrada.');
      const merged = { ...current, ...patch };
      const error = validateDebtInput(merged);
      if (error) throw new Error(error);

      const payments = await db.debtPayments.where('debtId').equals(id).toArray();
      const valorTotal = roundMoney(Number(merged.valorTotal));
      if (valorTotal < getDebtPaidTotal(id, payments)) {
        throw new Error('O valor total não pode ser menor que o que já foi pago.');
      }

      await db.debts.put(
        stripUndefined({
          ...merged,
          descricao: merged.descricao.trim(),
          credor: merged.credor.trim(),
          valorTotal,
          status: getDebtStatus({ id, valorTotal }, payments),
          updatedAt: new Date().toISOString(),
        }),
      );
    });
  };

  const deleteDebt = async (id: string) => {
    await db.transaction('rw', db.debts, db.debtPayments, db.transactions, async () => {
      const payments = await db.debtPayments.where('debtId').equals(id).toArray();
      await db.transactions.bulkDelete(payments.map((payment) => payment.transactionId));
      await db.debtPayments.bulkDelete(payments.map((payment) => payment.id));
      await db.debts.delete(id);
    });
  };

  // Cria a despesa, o registro de pagamento e atualiza o status em uma única transação.
  const payDebt = async (debtId: string, payment: { valor: number; data: string; contaId: string }) => {
    await db.transaction('rw', db.debts, db.debtPayments, db.transactions, async () => {
      const debt = await db.debts.get(debtId);
      if (!debt) throw new Error('Dívida não encontrada.');

      const payments = await db.debtPayments.where('debtId').equals(debtId).toArray();
      const remaining = roundMoney(Number(debt.valorTotal) - getDebtPaidTotal(debtId, payments));
      const error = validateDebtPayment(payment, remaining);
      if (error) throw new Error(error);

      const valor = roundMoney(Number(payment.valor));
      const transactionId = uuid();
      const now = new Date().toISOString();

      await db.transactions.add({
        id: transactionId,
        data: payment.data,
        descricao: `Pagamento de dívida: ${debt.descricao} (${debt.credor})`,
        categoria: DEBT_PAYMENT_CATEGORY,
        tipo: 'despesa',
        valor,
        formaPagamento: 'PIX',
        contaId: payment.contaId,
      });

      const newPayment: DebtPayment = {
        id: uuid(),
        debtId,
        valor,
        data: payment.data,
        contaId: payment.contaId,
        transactionId,
        createdAt: now,
      };
      await db.debtPayments.add(newPayment);

      await db.debts.update(debtId, {
        status: getDebtStatus(debt, [...payments, newPayment]),
        updatedAt: now,
      });
    });
  };

  const deleteDebtPayment = async (paymentId: string) => {
    await db.transaction('rw', db.debts, db.debtPayments, db.transactions, async () => {
      const payment = await db.debtPayments.get(paymentId);
      if (!payment) return;

      await db.transactions.delete(payment.transactionId);
      await db.debtPayments.delete(paymentId);

      const debt = await db.debts.get(payment.debtId);
      if (!debt) return;
      const payments = await db.debtPayments.where('debtId').equals(debt.id).toArray();
      await db.debts.update(debt.id, {
        status: getDebtStatus(debt, payments),
        updatedAt: new Date().toISOString(),
      });
    });
  };

  const pagarFatura = async (cartaoId: string, anoMes: string) => {
    const cartao = cartoesCredito.find((c) => c.id === cartaoId);
    if (!cartao) throw new Error('Cartão não encontrado');

    const faturaId = `fatura_${cartaoId}_${anoMes.replace('-', '')}`;
    const faturaStatus = faturaStatuses.find((f) => f.id === faturaId);

    if (!faturaStatus) {
      const { dataFechamento, dataVencimento } = calcularPeriodoFatura(cartao, anoMes);
      await db.faturaStatuses.add({
        id: faturaId,
        cartaoId,
        anoMes,
        status: 'paga',
        dataFechamento: format(dataFechamento, 'yyyy-MM-dd'),
        dataVencimento: format(dataVencimento, 'yyyy-MM-dd'),
      });
    } else {
      await db.faturaStatuses.update(faturaId, { status: 'paga' });
    }

    const info = getFaturasInfo(anoMes).find((f) => f.cartaoId === cartaoId);
    if (info) {
      await addTransaction({
        data: format(new Date(), 'yyyy-MM-dd'),
        descricao: `Pagamento Fatura ${cartao.nome} (${anoMes})`,
        categoria: 'Fatura de Cartão',
        tipo: 'despesa',
        valor: info.total,
        formaPagamento: 'PIX',
        contaId: cartao.contaDebitoId,
      });
    }
  };

  const addGoal = async (g: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    await db.goals.add(stripUndefined({ ...g, id: uuid(), createdAt: now, updatedAt: now }));
  };

  const updateGoal = async (id: string, g: Partial<Goal>) => {
    await db.goals.update(id, stripUndefined({ ...g, updatedAt: new Date().toISOString() }));
  };

  const deleteGoal = async (id: string) => {
    await db.goals.delete(id);
  };

  const getBackupSnapshot = useCallback(() => {
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      app: APP_NAME,
      data: buildCurrentBackupData(),
    };
  }, [buildCurrentBackupData]);

  const restoreBackupSnapshot = async (snapshot: FinanceBackupSnapshot) => {
    const { data } = snapshot;
    await db.transaction('rw', [
      db.transactions,
      db.categories,
      db.recurringTransactions,
      db.categoryBudgets,
      db.contas,
      db.cartoesCredito,
      db.faturaStatuses,
      db.loans,
      db.debts,
      db.debtPayments,
      db.goals,
      db.config
    ], async () => {
      await db.transactions.clear();
      await db.categories.clear();
      await db.recurringTransactions.clear();
      await db.categoryBudgets.clear();
      await db.contas.clear();
      await db.cartoesCredito.clear();
      await db.faturaStatuses.clear();
      await db.loans.clear();
      await db.debts.clear();
      await db.debtPayments.clear();
      await db.goals.clear();
      await db.config.clear();

      if (data.transactions?.length) await db.transactions.bulkAdd(data.transactions);
      if (data.categories?.length) await db.categories.bulkAdd(data.categories);
      if (data.recurringTransactions?.length) await db.recurringTransactions.bulkAdd(data.recurringTransactions);
      if (data.categoryBudgets?.length) await db.categoryBudgets.bulkAdd(data.categoryBudgets);
      if (data.contas?.length) await db.contas.bulkAdd(data.contas);
      if (data.cartoesCredito?.length) await db.cartoesCredito.bulkAdd(data.cartoesCredito);
      if (data.faturaStatuses?.length) await db.faturaStatuses.bulkAdd(data.faturaStatuses);
      if (data.loans?.length) await db.loans.bulkAdd(data.loans);
      if (data.debts?.length) await db.debts.bulkAdd(data.debts);
      if (data.debtPayments?.length) await db.debtPayments.bulkAdd(data.debtPayments);
      if (data.goals?.length) await db.goals.bulkAdd(data.goals);
      if (data.config) await db.config.add({ ...data.config, id: 'main' });
    });
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        categories,
        recurringTransactions,
        categoryBudgets,
        config,
        contas,
        cartoesCredito,
        faturaStatuses,
        loans,
        debts,
        debtPayments,
        goals,
        isDataLoaded,
        addGoal,
        updateGoal,
        deleteGoal,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addParcelado,
        transferir,
        addCategory,
        updateCategory,
        deleteCategory,
        addRecurringTransaction,
        updateRecurringTransaction,
        deleteRecurringTransaction,
        toggleRecurringTransaction,
        upsertCategoryBudget,
        deleteCategoryBudget,
        updateConfig,
        setThemeMode,
        addConta,
        updateConta,
        deleteConta,
        addCartaoCredito,
        updateCartaoCredito,
        deleteCartaoCredito,
        addLoan,
        updateLoan,
        deleteLoan,
        updateLoanStatus,
        addDebt,
        updateDebt,
        deleteDebt,
        payDebt,
        deleteDebtPayment,
        pagarFatura,
        getSaldoConta,
        getFaturasInfo,
        getLimiteDisponivel,
        getBackupSnapshot,
        restoreBackupSnapshot,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
