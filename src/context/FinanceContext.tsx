/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import type {
  AppConfig,
  FinanceBackupData,
  FinanceBackupSnapshot,
  CartaoCredito,
  Categoria,
  CategoryBudget,
  Conta,
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
  collection,
  doc,
  type CollectionReference,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
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
import { db } from '../services/firebase';
import { v4 as uuid } from 'uuid';
import { useAuth } from './AuthContext';
import {
  buildStorageKey,
  createBackupSnapshot,
  loadSnapshotFromStorage,
  saveSnapshotToStorage,
} from '../utils/localPersistence';

interface FinanceContextType {
  // Estado existente
  transactions: Transaction[];
  categories: Categoria[];
  recurringTransactions: RecurringTransaction[];
  categoryBudgets: CategoryBudget[];
  config: AppConfig;
  // Novo Sprint 2
  contas: Conta[];
  cartoesCredito: CartaoCredito[];
  faturaStatuses: FaturaStatus[];
  loans: Loan[];
  goals: Goal[];

  // CRUD Goals
  addGoal: (g: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateGoal: (id: string, g: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // CRUD Transações
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, t: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Sprint 2: adicionar compra parcelada
  addParcelado: (
    base: Omit<Transaction, 'id' | 'parcelaAtual' | 'totalParcelas' | 'parcelaGrupoId'>,
    totalParcelas: number,
  ) => Promise<void>;

  // Sprint 2: transferência entre contas
  transferir: (params: {
    contaOrigemId: string;
    contaDestinoId: string;
    valor: number;
    data: string;
    descricao?: string;
  }) => Promise<void>;

  // CRUD Categorias
  addCategory: (c: Omit<Categoria, 'id'>) => Promise<void>;
  updateCategory: (id: string, c: Partial<Categoria>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // CRUD Recorrências
  addRecurringTransaction: (r: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRecurringTransaction: (id: string, r: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  toggleRecurringTransaction: (id: string, active: boolean) => Promise<void>;

  // CRUD Orçamentos
  upsertCategoryBudget: (categoryId: string, monthlyLimit: number) => Promise<void>;
  deleteCategoryBudget: (id: string) => Promise<void>;

  // CRUD Config
  updateConfig: (c: Partial<AppConfig>) => Promise<void>;
  setThemeMode: (themeMode: ThemeMode) => Promise<void>;

  // Sprint 2: CRUD Contas
  addConta: (c: Omit<Conta, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateConta: (id: string, c: Partial<Conta>) => Promise<void>;
  deleteConta: (id: string) => Promise<void>;

  // Sprint 2: CRUD Cartões
  addCartaoCredito: (c: Omit<CartaoCredito, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCartaoCredito: (id: string, c: Partial<CartaoCredito>) => Promise<void>;
  deleteCartaoCredito: (id: string) => Promise<void>;

  // Loans
  addLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLoan: (id: string, loan: Partial<Loan>) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  updateLoanStatus: (id: string, status: LoanStatus) => Promise<void>;

  // Sprint 2: Operações de fatura
  pagarFatura: (cartaoId: string, anoMes: string) => Promise<void>;

  // Sprint 2: Helpers calculados
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

/**
 * Calcula o período de competência de uma fatura dado um cartão e um anoMes de referência.
 * - A fatura "de Abril" fecha no dia X de Abril (diaFechamento).
 * - Lançamentos que caem ANTES do fechamento vão pra fatura Abril.
 * - Vencimento é diaVencimento no mês seguinte ao fechamento.
 */
export const calcularPeriodoFatura = (
  cartao: CartaoCredito,
  anoMes: string, // YYYY-MM (mês de referência da fatura)
): { inicio: Date; fim: Date; dataFechamento: Date; dataVencimento: Date } => {
  const [ano, mes] = anoMes.split('-').map(Number);
  const dataFechamento = setDate(new Date(ano, mes - 1, 1), cartao.diaFechamento);

  // O período da fatura começa um dia após o fechamento do mês anterior
  const mesAnterior = addMonths(dataFechamento, -1);
  const inicio = addDays(setDate(mesAnterior, cartao.diaFechamento), 1);
  const fim = dataFechamento;

  // Vencimento ocorre no mês seguinte ao fechamento
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

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Categoria[]>(defaultCategories);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [config, setConfig] = useState<AppConfig>({
    metaEconomiaMensal: 1000,
    isDarkMode: false,
    themeMode: 'white',
  });
  // Sprint 2
  const [contas, setContas] = useState<Conta[]>([]);
  const [cartoesCredito, setCartoesCredito] = useState<CartaoCredito[]>([]);
  const [faturaStatuses, setFaturaStatuses] = useState<FaturaStatus[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const userId = user?.uid || null;
  const storageKey = userId ? buildStorageKey(userId) : null;

  const applyTheme = useCallback((themeMode: ThemeMode) => {
    const root = document.documentElement;
    const isDark = themeMode === 'black';
    root.classList.toggle('dark', isDark);
    root.dataset.theme = themeMode;
  }, []);

  const getUserCollection = useCallback(<T,>(collectionName: string): CollectionReference<T> => {
    if (!userId) {
      throw new Error('Usuario nao autenticado.');
    }

    return collection(db, 'users', userId, collectionName) as CollectionReference<T>;
  }, [userId]);

  const getUserDoc = useCallback((collectionName: string, documentId: string) => {
    if (!userId) {
      throw new Error('Usuario nao autenticado.');
    }

    return doc(db, 'users', userId, collectionName, documentId);
  }, [userId]);

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
  ]);

  useEffect(() => {
    if (!storageKey) return;
    const snapshot = loadSnapshotFromStorage(storageKey);
    if (!snapshot) return;

    setTransactions(snapshot.data.transactions);
    setCategories(snapshot.data.categories);
    setRecurringTransactions(snapshot.data.recurringTransactions);
    setCategoryBudgets(snapshot.data.categoryBudgets);
    setConfig(snapshot.data.config);
    setContas(snapshot.data.contas);
    setCartoesCredito(snapshot.data.cartoesCredito);
    setFaturaStatuses(snapshot.data.faturaStatuses);
    setLoans(snapshot.data.loans);
    setGoals(snapshot.data.goals || []);

    const normalizedTheme: ThemeMode =
      snapshot.data.config.themeMode || (snapshot.data.config.isDarkMode ? 'black' : 'white');
    applyTheme(normalizedTheme);
  }, [applyTheme, storageKey]);

  // ── Syncs Firestore ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      return;
    }

    const unsubscribe = onSnapshot(getUserCollection<Transaction>('transactions'), (snapshot) => {
      const data: Transaction[] = [];
      snapshot.forEach((docSnap) => data.push(docSnap.data() as Transaction));
      setTransactions(data);
    });
    return () => unsubscribe();
  }, [getUserCollection, userId]);

  useEffect(() => {
    if (!userId) {
      setCategories(defaultCategories);
      return;
    }

    const unsubscribe = onSnapshot(getUserCollection<Categoria>('categories'), (snapshot) => {
      if (snapshot.empty) {
        defaultCategories.forEach((cat) => {
          void setDoc(getUserDoc('categories', cat.id), { ...cat, userId });
        });
        setCategories(defaultCategories);
      } else {
        const data: Categoria[] = [];
        snapshot.forEach((docSnap) => data.push(docSnap.data() as Categoria));
        setCategories(data);
      }
    });
    return () => unsubscribe();
  }, [getUserCollection, userId]);

  useEffect(() => {
    if (!userId) {
      setRecurringTransactions([]);
      return;
    }

    const unsubscribe = onSnapshot(
      getUserCollection<RecurringTransaction>('recurringTransactions'),
      (snapshot) => {
        const data: RecurringTransaction[] = [];
        snapshot.forEach((docSnap) => data.push(docSnap.data() as RecurringTransaction));
        setRecurringTransactions(data);
      },
    );
    return () => unsubscribe();
  }, [getUserDoc, userId]);

  useEffect(() => {
    if (!userId) {
      setCategoryBudgets([]);
      return;
    }

    const unsubscribe = onSnapshot(getUserCollection<CategoryBudget>('categoryBudgets'), (snapshot) => {
      const data: CategoryBudget[] = [];
      snapshot.forEach((docSnap) => data.push(docSnap.data() as CategoryBudget));
      setCategoryBudgets(data);
    });
    return () => unsubscribe();
  }, [getUserCollection, userId]);

  useEffect(() => {
    if (!userId) {
      setConfig({ metaEconomiaMensal: 1000, isDarkMode: false, themeMode: 'white' });
      applyTheme('white');
      return;
    }

    const unsubscribe = onSnapshot(getUserDoc('config', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AppConfig;
        const normalizedTheme: ThemeMode =
          data.themeMode || (data.isDarkMode ? 'black' : 'white');
        setConfig({
          ...data,
          themeMode: normalizedTheme,
          isDarkMode: normalizedTheme === 'black',
        });
        applyTheme(normalizedTheme);
      } else {
        void setDoc(getUserDoc('config', 'main'), {
          metaEconomiaMensal: 1000,
          isDarkMode: false,
          themeMode: 'white',
          userId,
        });
      }
    });
    return () => unsubscribe();
  }, [applyTheme, getUserDoc, userId]);

  // Sprint 2: Sync Contas
  useEffect(() => {
    if (!userId) {
      setContas([]);
      return;
    }

    const unsubscribe = onSnapshot(getUserCollection<Conta>('contas'), (snapshot) => {
      const data: Conta[] = [];
      snapshot.forEach((docSnap) => data.push(docSnap.data() as Conta));
      setContas(data);
    });
    return () => unsubscribe();
  }, [getUserCollection, userId]);

  // Sprint 2: Sync Cartões
  useEffect(() => {
    if (!userId) {
      setCartoesCredito([]);
      return;
    }

    const unsubscribe = onSnapshot(getUserCollection<CartaoCredito>('cartoesCredito'), (snapshot) => {
      const data: CartaoCredito[] = [];
      snapshot.forEach((docSnap) => data.push(docSnap.data() as CartaoCredito));
      setCartoesCredito(data);
    });
    return () => unsubscribe();
  }, [userId]);

  // Sprint 2: Sync status das faturas
  useEffect(() => {
    if (!userId) {
      setFaturaStatuses([]);
      return;
    }

    const unsubscribe = onSnapshot(getUserCollection<FaturaStatus>('faturaStatus'), (snapshot) => {
      const data: FaturaStatus[] = [];
      snapshot.forEach((docSnap) => data.push(docSnap.data() as FaturaStatus));
      setFaturaStatuses(data);
    });
    return () => unsubscribe();
  }, [getUserCollection, userId]);

  useEffect(() => {
    if (!userId) {
      setLoans([]);
      return;
    }

    const unsubscribe = onSnapshot(getUserCollection<Loan>('loans'), (snapshot) => {
      const data: Loan[] = [];
      snapshot.forEach((docSnap) => data.push(docSnap.data() as Loan));
      setLoans(data);
    });
    return () => unsubscribe();
  }, [getUserCollection, userId]);

  useEffect(() => {
    if (!userId) {
      setGoals([]);
      return;
    }

    const unsubscribe = onSnapshot(getUserCollection<Goal>('goals'), (snapshot) => {
      const data: Goal[] = [];
      snapshot.forEach((docSnap) => data.push(docSnap.data() as Goal));
      setGoals(data);
    });
    return () => unsubscribe();
  }, [getUserCollection, userId]);

  // ── Geração de recorrências ──────────────────────────────────────────────────

  useEffect(() => {
    if (!userId) return;
    if (recurringTransactions.length === 0) return;

    const syncRecurringEntries = async () => {
      const today = startOfDay(new Date());
      const existingIds = new Set(transactionsIdSet);

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
            const transaction: Transaction = {
              id: txId,
              userId,
              data: txDate,
              descricao: rule.descricao,
              categoria: rule.categoria,
              tipo: rule.tipo,
              valor: Number(rule.valor),
              formaPagamento: rule.formaPagamento,
              recurringRuleId: rule.id,
              generatedByRecurrence: true,
            };

            await setDoc(getUserDoc('transactions', txId), transaction);
            existingIds.add(txId);
          }

          cursor = nextDateByFrequency(cursor, rule.frequency);
        }
      }
    };

    syncRecurringEntries();
  }, [getUserDoc, recurringTransactions, transactionsIdSet, userId]);

  // ── Helpers calculados ────────────────────────────────────────────────────────

  /** Calcula o saldo atual de uma conta considerando todas as transações vinculadas */
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

  /**
   * Retorna informações calculadas de todas as faturas dos cartões cadastrados.
   * Se anoMesParam for fornecido, filtra para aquela competência; senão retorna a fatura atual de cada cartão.
   */
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

  /** Calcula o limite disponível considerando todas as despesas ainda não quitadas do cartão */
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

  // ── CRUD Transações ──────────────────────────────────────────────────────────

  /**
   * Remove campos com valor `undefined` de um objeto antes de enviar ao Firestore.
   * O Firestore rejeita campos explicitamente `undefined` com FirebaseError.
   */
  const stripUndefined = <T extends object>(obj: T): T =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;

  const ensureUserId = () => {
    if (!userId) throw new Error('Usuario nao autenticado.');
    return userId;
  };

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    const ownerId = ensureUserId();
    const newId = uuid();
    const newTx = stripUndefined({ ...t, id: newId, userId: ownerId });
    await setDoc(getUserDoc('transactions', newId), newTx);
  };

  const updateTransaction = async (id: string, t: Partial<Transaction>) => {
    ensureUserId();
    await updateDoc(getUserDoc('transactions', id), t);
  };

  const deleteTransaction = async (id: string) => {
    ensureUserId();
    await deleteDoc(getUserDoc('transactions', id));
  };

  /** Cria N transações para uma compra parcelada, distribuídas nos meses seguintes */
  const addParcelado = async (
    base: Omit<Transaction, 'id' | 'parcelaAtual' | 'totalParcelas' | 'parcelaGrupoId'>,
    totalParcelas: number,
  ) => {
    const ownerId = ensureUserId();
    const grupoId = uuid();
    const dataBase = parseISO(base.data);

    const batch = Array.from({ length: totalParcelas }, (_, i) => {
      const id = uuid();
      const dataVencimento = format(addMonths(dataBase, i), 'yyyy-MM-dd');
      const tx: Transaction = stripUndefined({
        ...base,
        id,
        userId: ownerId,
        data: dataVencimento,
        parcelaAtual: i + 1,
        totalParcelas,
        parcelaGrupoId: grupoId,
        descricao: `${base.descricao} (${i + 1}/${totalParcelas})`,
      });
      return tx;
    });

    await Promise.all(batch.map((tx) => setDoc(getUserDoc('transactions', tx.id), tx)));
  };

  /** Cria uma transferência entre contas (2 transações vinculadas) */
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
    const ownerId = ensureUserId();
    const idSaida = uuid();
    const idEntrada = uuid();

    const txSaida: Transaction = {
      id: idSaida,
      userId: ownerId,
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
      userId: ownerId,
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

    await Promise.all([
      setDoc(getUserDoc('transactions', idSaida), txSaida),
      setDoc(getUserDoc('transactions', idEntrada), txEntrada),
    ]);
  };

  // ── CRUD Categorias ──────────────────────────────────────────────────────────

  const addCategory = async (c: Omit<Categoria, 'id'>) => {
    const ownerId = ensureUserId();
    const newId = uuid();
    const newCat = { ...c, id: newId, userId: ownerId };
    await setDoc(getUserDoc('categories', newId), newCat);
  };

  const updateCategory = async (id: string, c: Partial<Categoria>) => {
    ensureUserId();
    await updateDoc(getUserDoc('categories', id), c);
  };

  const deleteCategory = async (id: string) => {
    ensureUserId();
    await deleteDoc(getUserDoc('categories', id));
  };

  // ── CRUD Recorrências ────────────────────────────────────────────────────────

  const addRecurringTransaction = async (
    r: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    const ownerId = ensureUserId();
    const newId = uuid();
    const now = new Date().toISOString();
    const recurring: RecurringTransaction = {
      ...r,
      id: newId,
      userId: ownerId,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(getUserDoc('recurringTransactions', newId), recurring);
  };

  const updateRecurringTransaction = async (id: string, r: Partial<RecurringTransaction>) => {
    ensureUserId();
    await updateDoc(getUserDoc('recurringTransactions', id), {
      ...r,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteRecurringTransaction = async (id: string) => {
    ensureUserId();
    await deleteDoc(getUserDoc('recurringTransactions', id));
  };

  const toggleRecurringTransaction = async (id: string, active: boolean) => {
    await updateRecurringTransaction(id, { active });
  };

  // ── CRUD Orçamentos ──────────────────────────────────────────────────────────

  const upsertCategoryBudget = async (categoryId: string, monthlyLimit: number) => {
    const ownerId = ensureUserId();
    const normalizedLimit = Number(monthlyLimit);
    const existing = categoryBudgets.find((budget) => budget.categoryId === categoryId);

    if (existing) {
      await updateDoc(getUserDoc('categoryBudgets', existing.id), {
        monthlyLimit: normalizedLimit,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    const newId = uuid();
    const now = new Date().toISOString();
    const budget: CategoryBudget = {
      id: newId,
      userId: ownerId,
      categoryId,
      monthlyLimit: normalizedLimit,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(getUserDoc('categoryBudgets', newId), budget);
  };

  const deleteCategoryBudget = async (id: string) => {
    ensureUserId();
    await deleteDoc(getUserDoc('categoryBudgets', id));
  };

  // ── CRUD Config ──────────────────────────────────────────────────────────────

  const updateConfig = async (c: Partial<AppConfig>) => {
    const ownerId = ensureUserId();
    await setDoc(getUserDoc('config', 'main'), { ...c, userId: ownerId }, { merge: true });
  };

  const setThemeMode = async (themeMode: ThemeMode) => {
    await updateConfig({
      themeMode,
      isDarkMode: themeMode === 'black',
    });
  };

  // ── CRUD Contas ──────────────────────────────────────────────────────────────

  const addConta = async (c: Omit<Conta, 'id' | 'createdAt' | 'updatedAt'>) => {
    const ownerId = ensureUserId();
    const newId = uuid();
    const now = new Date().toISOString();
    const conta: Conta = { ...c, id: newId, userId: ownerId, createdAt: now, updatedAt: now };
    await setDoc(getUserDoc('contas', newId), conta);
  };

  const updateConta = async (id: string, c: Partial<Conta>) => {
    ensureUserId();
    await updateDoc(getUserDoc('contas', id), { ...c, updatedAt: new Date().toISOString() });
  };

  const deleteConta = async (id: string) => {
    ensureUserId();
    await deleteDoc(getUserDoc('contas', id));
  };

  // ── CRUD Cartões ─────────────────────────────────────────────────────────────

  const addCartaoCredito = async (c: Omit<CartaoCredito, 'id' | 'createdAt' | 'updatedAt'>) => {
    const ownerId = ensureUserId();
    const newId = uuid();
    const now = new Date().toISOString();
    const cartao: CartaoCredito = { ...c, id: newId, userId: ownerId, createdAt: now, updatedAt: now };
    await setDoc(getUserDoc('cartoesCredito', newId), cartao);
  };

  const updateCartaoCredito = async (id: string, c: Partial<CartaoCredito>) => {
    ensureUserId();
    await updateDoc(getUserDoc('cartoesCredito', id), { ...c, updatedAt: new Date().toISOString() });
  };

  const deleteCartaoCredito = async (id: string) => {
    ensureUserId();
    await deleteDoc(getUserDoc('cartoesCredito', id));
  };

  const addLoan = async (loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>) => {
    const ownerId = ensureUserId();
    const newId = uuid();
    const now = new Date().toISOString();
    const payload: Loan = {
      ...loan,
      id: newId,
      userId: ownerId,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(getUserDoc('loans', newId), payload);
  };

  const updateLoan = async (id: string, loan: Partial<Loan>) => {
    ensureUserId();
    await updateDoc(getUserDoc('loans', id), { ...loan, updatedAt: new Date().toISOString() });
  };

  const deleteLoan = async (id: string) => {
    ensureUserId();
    await deleteDoc(getUserDoc('loans', id));
  };

  const updateLoanStatus = async (id: string, status: LoanStatus) => {
    await updateLoan(id, { status });
  };

  // ── CRUD Goals ───────────────────────────────────────────────────────────────

  const addGoal = async (g: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const ownerId = ensureUserId();
    const newId = uuid();
    const now = new Date().toISOString();
    const payload: Goal = {
      ...g,
      id: newId,
      userId: ownerId,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(getUserDoc('goals', newId), payload);
  };

  const updateGoal = async (id: string, g: Partial<Goal>) => {
    ensureUserId();
    await updateDoc(getUserDoc('goals', id), { ...g, updatedAt: new Date().toISOString() });
  };

  const deleteGoal = async (id: string) => {
    ensureUserId();
    await deleteDoc(getUserDoc('goals', id));
  };

  // ── Operações de Fatura ──────────────────────────────────────────────────────

  const pagarFatura = async (cartaoId: string, anoMes: string) => {
    const ownerId = ensureUserId();
    const cartao = cartoesCredito.find((c) => c.id === cartaoId);
    if (!cartao) return;

    const { dataFechamento, dataVencimento } = calcularPeriodoFatura(cartao, anoMes);
    const faturaId = `fatura_${cartaoId}_${anoMes.replace('-', '')}`;

    const faturasInfo = getFaturasInfo(anoMes);
    const faturaInfo = faturasInfo.find((f) => f.cartaoId === cartaoId);
    const totalFatura = faturaInfo?.total ?? 0;

    // Persiste o status como 'paga'
    const statusDoc: FaturaStatus = {
      id: faturaId,
      userId: ownerId,
      cartaoId,
      anoMes,
      status: 'paga',
      dataFechamento: format(dataFechamento, 'yyyy-MM-dd'),
      dataVencimento: format(dataVencimento, 'yyyy-MM-dd'),
    };
    await setDoc(getUserDoc('faturaStatus', faturaId), statusDoc);

    // Registra saída na conta de débito vinculada (se houver e se total > 0)
    if (cartao.contaDebitoId && totalFatura > 0) {
      const txPagamento: Transaction = {
        id: uuid(),
        userId: ownerId,
        data: format(dataVencimento, 'yyyy-MM-dd'),
        descricao: `Pagamento fatura ${cartao.nome} (${anoMes})`,
        categoria: 'Fatura de Cartão',
        tipo: 'despesa',
        valor: totalFatura,
        formaPagamento: 'Débito',
        contaId: cartao.contaDebitoId,
      };
      await setDoc(getUserDoc('transactions', txPagamento.id), txPagamento);
    }
  };

  useEffect(() => {
    if (!storageKey) return;
    const snapshot = createBackupSnapshot(buildCurrentBackupData());
    saveSnapshotToStorage(storageKey, snapshot);
  }, [buildCurrentBackupData, storageKey]);

  const getBackupSnapshot = (): FinanceBackupSnapshot => createBackupSnapshot(buildCurrentBackupData());

  const restoreBackupSnapshot = async (snapshot: FinanceBackupSnapshot) => {
    const payload = snapshot.data;
    setTransactions(payload.transactions);
    setCategories(payload.categories);
    setRecurringTransactions(payload.recurringTransactions);
    setCategoryBudgets(payload.categoryBudgets);
    setConfig(payload.config);
    setContas(payload.contas);
    setCartoesCredito(payload.cartoesCredito);
    setFaturaStatuses(payload.faturaStatuses);
    setLoans(payload.loans);
    setGoals(payload.goals || []);

    const normalizedTheme: ThemeMode =
      payload.config.themeMode || (payload.config.isDarkMode ? 'black' : 'white');
    applyTheme(normalizedTheme);

    if (storageKey) {
      saveSnapshotToStorage(storageKey, createBackupSnapshot(payload));
    }

    if (!userId) return;

    const replaceCollection = async <T extends { id: string }>(
      collectionName: string,
      items: T[],
    ) => {
      const colRef = getUserCollection<T>(collectionName);
      const snapshotDocs = await getDocs(colRef);
      const batch = writeBatch(db);

      snapshotDocs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      items.forEach((item) => {
        batch.set(getUserDoc(collectionName, item.id), item);
      });

      await batch.commit();
    };

    await Promise.all([
      replaceCollection('transactions', payload.transactions),
      replaceCollection('categories', payload.categories),
      replaceCollection('recurringTransactions', payload.recurringTransactions),
      replaceCollection('categoryBudgets', payload.categoryBudgets),
      replaceCollection('contas', payload.contas),
      replaceCollection('cartoesCredito', payload.cartoesCredito),
      replaceCollection('faturaStatus', payload.faturaStatuses),
      replaceCollection('loans', payload.loans),
      replaceCollection('goals', payload.goals || []),
      setDoc(getUserDoc('config', 'main'), { ...payload.config, userId }),
    ]);
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
        goals,
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
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
};
