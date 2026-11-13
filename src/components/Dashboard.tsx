import { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  CreditCard,
  DollarSign,
  HandCoins,
  PiggyBank,
  ShieldAlert,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, isAfter, isSameMonth, parseISO, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  buildInsightsHistory,
  calculateCategoryMonthComparison,
  calculateMonthEndProjection,
} from '../utils/financialInsights';
import { calculateDashboardTotals } from '../utils/financialCalculations';
import { getTotalOwed } from '../utils/debtCalculations';

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#E23670',
  '#26A69A',
  '#9C27B0',
];

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export const Dashboard = () => {
  const {
    transactions,
    config,
    categoryBudgets,
    categories,
    cartoesCredito,
    getFaturasInfo,
    debts,
    debtPayments,
  } = useFinance();

  const totalDevido = useMemo(() => getTotalOwed(debts, debtPayments), [debts, debtPayments]);

  const currentMonth = startOfMonth(new Date());
  const anoMesAtual = format(new Date(), 'yyyy-MM');
  const anoMesProximo = format(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    'yyyy-MM',
  );

  const stats = useMemo(() => calculateDashboardTotals(transactions, new Date()), [transactions]);

  const projection = useMemo(
    () => calculateMonthEndProjection(transactions, new Date()),
    [transactions],
  );

  const monthlyComparison = useMemo(
    () => calculateCategoryMonthComparison(transactions, new Date()),
    [transactions],
  );

  const insightsPreview = useMemo(
    () => buildInsightsHistory(transactions, new Date()).slice(0, 5),
    [transactions],
  );

  const faturasAtuais = useMemo(() => getFaturasInfo(anoMesAtual), [getFaturasInfo, anoMesAtual]);
  const faturasProximas = useMemo(
    () => getFaturasInfo(anoMesProximo),
    [getFaturasInfo, anoMesProximo],
  );

  const totalFaturasAbertas = useMemo(
    () => faturasAtuais.filter((fatura) => fatura.status !== 'paga').reduce((sum, fatura) => sum + fatura.total, 0),
    [faturasAtuais],
  );

  const totalFaturasProximas = useMemo(
    () => faturasProximas.reduce((sum, fatura) => sum + fatura.total, 0),
    [faturasProximas],
  );

  const proximoVencimento = useMemo(() => {
    const hoje = new Date();
    const pendentes = faturasAtuais
      .filter((fatura) => fatura.status !== 'paga' && fatura.total > 0)
      .map((fatura) => ({ ...fatura, vencDate: parseISO(fatura.dataVencimento) }))
      .filter((fatura) => isAfter(fatura.vencDate, hoje));

    if (pendentes.length === 0) return null;
    return pendentes.sort((a, b) => a.vencDate.getTime() - b.vencDate.getTime())[0];
  }, [faturasAtuais]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    transactions.forEach((transaction) => {
      if (transaction.tipo === 'despesa' && isSameMonth(parseISO(transaction.data), currentMonth)) {
        data[transaction.categoria] = (data[transaction.categoria] || 0) + Number(transaction.valor);
      }
    });

    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, currentMonth]);

  const flowData = useMemo(() => {
    const data = [];
    for (let index = 11; index >= 0; index -= 1) {
      const month = subMonths(currentMonth, index);
      let receitas = 0;
      let despesas = 0;
      transactions.forEach((transaction) => {
        if (transaction.tipo === 'transferencia') return;
        if (!isSameMonth(parseISO(transaction.data), month)) return;
        if (transaction.tipo === 'receita') receitas += Number(transaction.valor);
        if (transaction.tipo === 'despesa') despesas += Number(transaction.valor);
      });
      data.push({
        name: format(month, 'MMM', { locale: ptBR }),
        Receitas: receitas,
        Despesas: despesas,
      });
    }
    return data;
  }, [transactions, currentMonth]);

  const budgetRisks = useMemo(() => {
    const categoryById = new Map(categories.map((category) => [category.id, category]));
    const monthExpenses = new Map<string, number>();

    transactions.forEach((transaction) => {
      if (transaction.tipo !== 'despesa') return;
      if (!isSameMonth(parseISO(transaction.data), currentMonth)) return;
      monthExpenses.set(
        transaction.categoria,
        (monthExpenses.get(transaction.categoria) || 0) + Number(transaction.valor),
      );
    });

    return categoryBudgets
      .map((budget) => {
        const category = categoryById.get(budget.categoryId);
        if (!category) return null;

        const spent = monthExpenses.get(category.nome) || 0;
        const limit = Number(budget.monthlyLimit);
        if (limit <= 0) return null;

        const percent = Math.round((spent / limit) * 100);
        return {
          categoryId: category.id,
          categoryName: category.nome,
          spent,
          limit,
          percent,
          status: percent >= 100 ? 'danger' : percent >= 80 ? 'warning' : 'safe',
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.percent - a.percent);
  }, [categories, categoryBudgets, transactions, currentMonth]);

  const isEconomiaPositiva = stats.economiaMes >= 0;
  const isMetaAtingida = stats.economiaMes >= config.metaEconomiaMensal;
  const warningBudgets = budgetRisks.filter((item) => item.status === 'warning');
  const exceededBudgets = budgetRisks.filter((item) => item.status === 'danger');
  const riskCount = warningBudgets.length + exceededBudgets.length;
  const saldoAjustado = stats.saldo - totalFaturasAbertas;

  const formatPercentage = (value: number | null) => {
    if (value === null) return '--';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Visão Geral</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-muted-foreground">Saldo Total</p>
            <DollarSign className="text-primary" size={18} />
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${stats.saldo >= 0 ? 'text-foreground' : 'text-danger'}`}>
              {formatCurrency(stats.saldo)}
            </h3>
            {totalFaturasAbertas > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Real:{' '}
                <span className={`font-medium ${saldoAjustado >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(saldoAjustado)}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-muted-foreground">Receitas (Mês)</p>
            <ArrowUpCircle className="text-success" size={18} />
          </div>
          <h3 className="text-2xl font-bold">{formatCurrency(stats.mesAtualReceitas)}</h3>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-muted-foreground">Despesas (Mês)</p>
            <ArrowDownCircle className="text-danger" size={18} />
          </div>
          <h3 className="text-2xl font-bold">{formatCurrency(stats.mesAtualDespesas)}</h3>
        </div>

        <div className={`bg-card p-5 rounded-xl border ${isMetaAtingida ? 'border-success/50' : 'border-border'} shadow-sm`}>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-muted-foreground">Economia (Mês)</p>
            <PiggyBank className={isEconomiaPositiva ? 'text-success' : 'text-danger'} size={18} />
          </div>
          <h3 className={`text-2xl font-bold ${isEconomiaPositiva ? 'text-success' : 'text-danger'}`}>
            {formatCurrency(stats.economiaMes)}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Meta: {formatCurrency(config.metaEconomiaMensal)}
          </p>
        </div>

        {cartoesCredito.length > 0 && (
          <div className={`bg-card p-5 rounded-xl border ${totalFaturasAbertas > 0 ? 'border-orange-400/40' : 'border-border'} shadow-sm`}>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium text-muted-foreground">Faturas em Aberto</p>
              <CreditCard className={totalFaturasAbertas > 0 ? 'text-orange-500' : 'text-muted-foreground'} size={18} />
            </div>
            <h3 className={`text-2xl font-bold ${totalFaturasAbertas > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-foreground'}`}>
              {formatCurrency(totalFaturasAbertas)}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Prox. fatura: {formatCurrency(totalFaturasProximas)}
            </p>
          </div>
        )}

        <div className={`bg-card p-5 rounded-xl border ${totalDevido > 0 ? 'border-danger/40' : 'border-border'} shadow-sm`}>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-muted-foreground">Total devido</p>
            <HandCoins className={totalDevido > 0 ? 'text-danger' : 'text-muted-foreground'} size={18} />
          </div>
          <h3 className={`text-2xl font-bold ${totalDevido > 0 ? 'text-danger' : 'text-foreground'}`}>
            {formatCurrency(totalDevido)}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {totalDevido > 0 ? 'Dívidas em aberto' : 'Nenhuma dívida em aberto'}
          </p>
        </div>

        <div className={`bg-card p-5 rounded-xl border ${riskCount > 0 ? 'border-amber-500/40' : 'border-border'} shadow-sm`}>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-muted-foreground">Categorias em Risco</p>
            <ShieldAlert className={riskCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'} size={18} />
          </div>
          <h3 className={`text-2xl font-bold ${riskCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
            {riskCount}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {riskCount > 0 ? 'Acima de 80% do orçamento' : 'Nenhum em risco'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Projeção de fim de mês</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Receita prevista</span>
              <strong className="text-success">{formatCurrency(projection.projectedIncome)}</strong>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Despesa prevista</span>
              <strong className="text-danger">{formatCurrency(projection.projectedExpense)}</strong>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-border pt-2 mt-2">
              <span className="font-medium">Saldo previsto</span>
              <strong className={projection.projectedBalance >= 0 ? 'text-success' : 'text-danger'}>
                {formatCurrency(projection.projectedBalance)}
              </strong>
            </div>
            <p className="text-xs text-muted-foreground">
              Base: {projection.observedDays}/{projection.totalDaysInMonth} dias.
            </p>
            <p className="text-xs text-muted-foreground">
              Média diária receita/despesa: {formatCurrency(projection.averageDailyIncome)} / {formatCurrency(projection.averageDailyExpense)}
            </p>
            <p className="text-xs text-muted-foreground">
              Confiança: <span className="font-medium">{projection.confidence}</span>
            </p>
          </div>
        </div>

        <div className="xl:col-span-2 bg-card p-5 rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Comparação mês atual vs mês anterior por categoria
          </h3>
          {monthlyComparison.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados suficientes para comparação.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-2 pr-2">Categoria</th>
                    <th className="py-2 px-2">Atual</th>
                    <th className="py-2 px-2">Anterior</th>
                    <th className="py-2 px-2">Variação</th>
                    <th className="py-2 pl-2">%</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyComparison.slice(0, 8).map((row) => (
                    <tr key={row.categoryKey} className="border-b border-border/60">
                      <td className="py-2 pr-2 font-medium">{row.categoryName}</td>
                      <td className="py-2 px-2">{formatCurrency(row.currentMonthTotal)}</td>
                      <td className="py-2 px-2">{formatCurrency(row.previousMonthTotal)}</td>
                      <td className={`py-2 px-2 ${row.absoluteChange >= 0 ? 'text-danger' : 'text-success'}`}>
                        {row.absoluteChange >= 0 ? '+' : '-'} {formatCurrency(Math.abs(row.absoluteChange))}
                      </td>
                      <td className={`py-2 pl-2 ${row.percentageChange !== null && row.percentageChange >= 0 ? 'text-danger' : 'text-success'}`}>
                        {formatPercentage(row.percentageChange)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {proximoVencimento && (
        <div className="bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 p-4 rounded-lg flex items-center gap-3">
          <Calendar size={18} />
          <p className="text-sm font-medium">
            Próximo vencimento: <strong>{proximoVencimento.cartaoNome}</strong> - {formatCurrency(proximoVencimento.total)} em{' '}
            {format(parseISO(proximoVencimento.dataVencimento), 'dd/MM/yyyy')}
          </p>
        </div>
      )}

      {!isMetaAtingida && stats.mesAtualDespesas > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle size={18} />
          <p className="text-sm font-medium">
            Atenção: sua economia deste mês está abaixo da meta de {formatCurrency(config.metaEconomiaMensal)}.
          </p>
        </div>
      )}

      {insightsPreview.length > 0 && (
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <h3 className="font-semibold mb-3">Insights recentes</h3>
          <div className="space-y-2">
            {insightsPreview.map((entry) => (
              <div key={entry.id} className="text-sm flex items-start justify-between gap-3 border-b border-border/60 pb-2">
                <div>
                  <p className="font-medium">{entry.categoryName}</p>
                  <p className="text-muted-foreground">{entry.summary}</p>
                </div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{entry.kind}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {categoryData.length > 0 && categoryData[0].value > stats.mesAtualDespesas * 0.4 && (
        <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle size={18} />
          <p className="text-sm font-medium">
            Alerta: a categoria <strong>{categoryData[0].name}</strong> representa{' '}
            {Math.round((categoryData[0].value / stats.mesAtualDespesas) * 100)}% dos seus gastos.
          </p>
        </div>
      )}

      {exceededBudgets.slice(0, 2).map((item) => (
        <div key={item.categoryId} className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle size={18} />
          <p className="text-sm font-medium">
            Orçamento estourado em <strong>{item.categoryName}</strong>: {formatCurrency(item.spent)} de{' '}
            {formatCurrency(item.limit)} ({item.percent}%).
          </p>
        </div>
      ))}

      {warningBudgets.slice(0, 2).map((item) => (
        <div key={item.categoryId} className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle size={18} />
          <p className="text-sm font-medium">
            Atenção em <strong>{item.categoryName}</strong>: {item.percent}% do orçamento consumido.
          </p>
        </div>
      ))}

      {cartoesCredito.length > 0 && faturasAtuais.some((fatura) => fatura.total > 0) && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CreditCard size={16} className="text-primary" />
            Faturas de Cartão - {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
          </h3>
          <div className="space-y-3">
            {faturasAtuais
              .filter((fatura) => fatura.total > 0)
              .map((fatura) => {
                const cartao = cartoesCredito.find((item) => item.id === fatura.cartaoId);
                const maxTotal = Math.max(...faturasAtuais.map((item) => item.total), 1);
                const pct = Math.min((fatura.total / maxTotal) * 100, 100);
                const statusColors: Record<string, string> = {
                  aberta: 'bg-orange-400',
                  fechada: 'bg-blue-400',
                  paga: 'bg-success',
                };
                return (
                  <div key={fatura.cartaoId} className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cartao?.cor || '#888' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium truncate">{fatura.cartaoNome}</span>
                        <span className={`font-semibold ${fatura.status === 'paga' ? 'text-success' : 'text-foreground'}`}>
                          {formatCurrency(fatura.total)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${statusColors[fatura.status] || 'bg-primary'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-0.5 text-xs text-muted-foreground">
                        <span>Vence: {format(parseISO(fatura.dataVencimento), 'dd/MM')}</span>
                        <span>
                          {fatura.status === 'paga'
                            ? 'Paga'
                            : fatura.status === 'fechada'
                              ? 'Fechada'
                              : 'Em aberto'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card p-6 rounded-xl border border-border flex flex-col shadow-sm min-w-0">
          <h3 className="font-semibold mb-6">Fluxo de Caixa - Últimos 12 meses</h3>
          <div className="w-full min-w-0 h-[280px]">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={flowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Receitas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Despesas" fill="hsl(var(--danger))" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border flex flex-col shadow-sm min-w-0">
          <h3 className="font-semibold mb-6">Despesas por Categoria</h3>
          <div className="w-full min-w-0 h-[280px] flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: unknown) => {
                      const parsed = Array.isArray(value) ? Number(value[0] || 0) : Number(value || 0);
                      return formatCurrency(parsed);
                    }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhuma despesa registrada neste mês.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


