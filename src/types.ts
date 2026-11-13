export type TransactionType = 'receita' | 'despesa' | 'transferencia';
export type PaymentMethod = 'Dinheiro' | 'Cartão de crédito' | 'Débito' | 'PIX';
export type RecurrenceFrequency = 'diaria' | 'semanal' | 'mensal' | 'anual';
export type TipoConta = 'corrente' | 'poupanca' | 'dinheiro' | 'investimento';
export type LoanType = 'emprestado' | 'recebido';
export type LoanStatus = 'em_aberto' | 'quitado' | 'atrasado';
export type ThemeMode = 'white' | 'black' | 'gray';

export interface Transaction {
  id: string;
  userId?: string;
  data: string; // YYYY-MM-DD
  descricao: string;
  categoria: string;
  tipo: TransactionType;
  valor: number;
  formaPagamento: PaymentMethod;
  recurringRuleId?: string;
  generatedByRecurrence?: boolean;
  // Sprint 2: campos opcionais para contas e cartões
  contaId?: string;
  cartaoId?: string;
  parcelaAtual?: number;
  totalParcelas?: number;
  parcelaGrupoId?: string;
  transferenciaPairId?: string; // ID da transação par na transferência
  isTransferenciaOrigem?: boolean;
}

export interface Categoria {
  id: string;
  userId?: string;
  nome: string;
  tipo: TransactionType | 'ambos';
}

export interface RecurringTransaction {
  id: string;
  userId?: string;
  descricao: string;
  categoria: string;
  tipo: TransactionType;
  valor: number;
  formaPagamento: PaymentMethod;
  frequency: RecurrenceFrequency;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryBudget {
  id: string;
  userId?: string;
  categoryId: string;
  monthlyLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppConfig {
  metaEconomiaMensal: number;
  isDarkMode: boolean;
  themeMode?: ThemeMode;
  aiApiKey?: string;
  aiProvider?: 'openai' | 'gemini';
  aiModel?: string;
}

// Sprint 2: Conta/Carteira
export interface Conta {
  id: string;
  userId?: string;
  nome: string;
  tipo: TipoConta;
  saldoInicial: number;
  cor: string;     // hex para identificação visual
  icone: string;   // nome do ícone lucide
  createdAt: string;
  updatedAt: string;
}

// Sprint 2: Cartão de crédito
export interface CartaoCredito {
  id: string;
  userId?: string;
  nome: string;
  limite: number;
  diaFechamento: number;   // 1-28
  diaVencimento: number;   // 1-28
  cor: string;
  contaDebitoId: string;   // conta que paga a fatura
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  id: string;
  userId?: string;
  descricao: string;
  valor: number;
  tipo: LoanType;
  data: string; // YYYY-MM-DD
  status: LoanStatus;
  createdAt: string;
  updatedAt: string;
}

export type DebtStatus = 'pendente' | 'parcial' | 'quitada';
export type DebtPriority = 'baixa' | 'media' | 'alta';

export interface Debt {
  id: string;
  userId?: string;
  descricao: string;
  credor: string;
  valorTotal: number;
  vencimento?: string; // YYYY-MM-DD
  prioridade?: DebtPriority;
  observacao?: string;
  jurosInformativo?: string; // texto livre, ex.: "2% ao mês"
  parcelasInformativo?: string; // texto livre, ex.: "10x de R$ 150,00"
  status: DebtStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DebtPayment {
  id: string;
  userId?: string;
  debtId: string;
  valor: number;
  data: string; // YYYY-MM-DD
  contaId: string;
  transactionId: string; // despesa gerada pelo pagamento
  createdAt: string;
}

export interface Goal {
  id: string;
  userId?: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

// Sprint 2: Status persistido de uma fatura (o total é calculado via useMemo)
export interface FaturaStatus {
  id: string;              // `fatura_${cartaoId}_${anoMes}`
  userId?: string;
  cartaoId: string;
  anoMes: string;          // YYYY-MM
  status: 'aberta' | 'fechada' | 'paga';
  dataFechamento: string;  // YYYY-MM-DD
  dataVencimento: string;  // YYYY-MM-DD
}

// Sprint 2: Informações calculadas de uma fatura (não persistida)
export interface FaturaInfo {
  cartaoId: string;
  cartaoNome: string;
  anoMes: string;
  dataFechamento: string;
  dataVencimento: string;
  status: 'aberta' | 'fechada' | 'paga';
  total: number;
  transacoes: Transaction[];
}

export type ProjectionConfidence = 'baixa' | 'media' | 'alta';

export interface ProjectionSummary {
  projectedIncome: number;
  projectedExpense: number;
  projectedBalance: number;
  incomeToDate: number;
  expenseToDate: number;
  observedDays: number;
  totalDaysInMonth: number;
  averageDailyIncome: number;
  averageDailyExpense: number;
  confidence: ProjectionConfidence;
}

export interface CategoryComparison {
  categoryKey: string;
  categoryName: string;
  currentMonthTotal: number;
  previousMonthTotal: number;
  absoluteChange: number;
  percentageChange: number | null;
}

export type InsightKind = 'increase' | 'decrease' | 'anomaly';
export type InsightSeverity = 'info' | 'warning' | 'critical';

export interface InsightAlert {
  id: string;
  kind: 'increase' | 'decrease';
  categoryKey: string;
  categoryName: string;
  summary: string;
  absoluteChange: number;
  percentageChange: number;
  generatedAt: string;
  severity: InsightSeverity;
}

export interface AnomalyAlert {
  id: string;
  kind: 'anomaly';
  categoryKey: string;
  categoryName: string;
  summary: string;
  value: number;
  baselineAverage: number;
  threshold: number;
  generatedAt: string;
  severity: InsightSeverity;
}

export type InsightHistoryEntry = InsightAlert | AnomalyAlert;

export interface FinanceBackupData {
  transactions: Transaction[];
  categories: Categoria[];
  recurringTransactions: RecurringTransaction[];
  categoryBudgets: CategoryBudget[];
  config: AppConfig;
  contas: Conta[];
  cartoesCredito: CartaoCredito[];
  faturaStatuses: FaturaStatus[];
  loans: Loan[];
  goals: Goal[];
  /** Ausente em backups anteriores à v4.12.0. */
  debts?: Debt[];
  /** Ausente em backups anteriores à v4.12.0. */
  debtPayments?: DebtPayment[];
}

export interface FinanceBackupSnapshot {
  version: string;
  exportedAt: string;
  app: string;
  data: FinanceBackupData;
}
