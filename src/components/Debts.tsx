import { useMemo, useState } from 'react';
import { AlertTriangle, Check, ChevronDown, ChevronUp, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Debt, DebtPriority, DebtStatus } from '../types';
import { useFinance } from '../context/FinanceContext';
import { getDebtPaidTotal, getDebtRemaining, getTotalOwed, isDebtOverdue } from '../utils/debtCalculations';
import { validateDebtInput, validateDebtPayment, type DebtInput } from '../utils/debtValidation';

const PRIORIDADES: DebtPriority[] = ['baixa', 'media', 'alta'];

const labelsStatus: Record<DebtStatus, string> = {
  pendente: 'Pendente',
  parcial: 'Parcial',
  quitada: 'Quitada',
};

const labelsPrioridade: Record<DebtPriority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

const emptyDebtForm = (): DebtInput => ({
  descricao: '',
  credor: '',
  valorTotal: 0,
  vencimento: '',
  prioridade: undefined,
  observacao: '',
  jurosInformativo: '',
  parcelasInformativo: '',
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (value: string) => format(parseISO(value), 'dd/MM/yyyy');

const today = () => format(new Date(), 'yyyy-MM-dd');

const inputClass = 'w-full bg-background border border-input rounded-md px-3 py-2 text-sm';

export const Debts = () => {
  const { debts, debtPayments, contas, addDebt, updateDebt, deleteDebt, payDebt, deleteDebtPayment } =
    useFinance();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DebtInput>(emptyDebtForm());
  const [error, setError] = useState('');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState({ valor: 0, data: today(), contaId: '' });
  const [payError, setPayError] = useState('');

  const totalOwed = useMemo(() => getTotalOwed(debts, debtPayments), [debts, debtPayments]);

  const sortedDebts = useMemo(() => {
    const open = debts.filter((debt) => debt.status !== 'quitada');
    const settled = debts.filter((debt) => debt.status === 'quitada');
    const byDue = (a: Debt, b: Debt) => (a.vencimento || '9999-12-31').localeCompare(b.vencimento || '9999-12-31');
    return [...open.sort(byDue), ...settled.sort(byDue)];
  }, [debts]);

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyDebtForm());
    setError('');
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyDebtForm());
    setError('');
    setIsFormOpen(true);
  };

  const openEdit = (debt: Debt) => {
    setEditingId(debt.id);
    setForm({
      descricao: debt.descricao,
      credor: debt.credor,
      valorTotal: debt.valorTotal,
      vencimento: debt.vencimento ?? '',
      prioridade: debt.prioridade,
      observacao: debt.observacao ?? '',
      jurosInformativo: debt.jurosInformativo ?? '',
      parcelasInformativo: debt.parcelasInformativo ?? '',
    });
    setError('');
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    const validationError = validateDebtInput(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: DebtInput = {
      ...form,
      valorTotal: Number(form.valorTotal),
      vencimento: form.vencimento || undefined,
      observacao: form.observacao?.trim() || undefined,
      jurosInformativo: form.jurosInformativo?.trim() || undefined,
      parcelasInformativo: form.parcelasInformativo?.trim() || undefined,
    };

    try {
      if (editingId) await updateDebt(editingId, payload);
      else await addDebt(payload);
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a dívida agora. Tente novamente.');
    }
  };

  const handleDelete = async (debt: Debt) => {
    const confirmed = window.confirm(
      `Excluir a dívida "${debt.descricao}"? Os pagamentos e as despesas geradas por eles também serão removidos.`,
    );
    if (!confirmed) return;
    try {
      await deleteDebt(debt.id);
    } catch {
      setError('Não foi possível excluir a dívida agora. Tente novamente.');
    }
  };

  const openPayment = (debt: Debt) => {
    setPayingId(debt.id);
    setExpandedId(debt.id);
    setPayError('');
    setPayForm({
      valor: getDebtRemaining(debt, debtPayments),
      data: today(),
      contaId: contas.length === 1 ? contas[0].id : '',
    });
  };

  const handlePay = async (debt: Debt) => {
    const remaining = getDebtRemaining(debt, debtPayments);
    const validationError = validateDebtPayment(payForm, remaining);
    if (validationError) {
      setPayError(validationError);
      return;
    }
    try {
      await payDebt(debt.id, { ...payForm, valor: Number(payForm.valor) });
      setPayingId(null);
      setPayError('');
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Não foi possível registrar o pagamento. Tente novamente.');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    const confirmed = window.confirm('Desfazer este pagamento? A despesa gerada também será removida.');
    if (!confirmed) return;
    try {
      await deleteDebtPayment(paymentId);
    } catch {
      setError('Não foi possível desfazer o pagamento agora. Tente novamente.');
    }
  };

  const contaNome = (contaId: string) => contas.find((conta) => conta.id === contaId)?.nome ?? 'Conta removida';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dívidas</h2>
          <p className="text-sm text-muted-foreground">
            Total em aberto: <strong className="text-foreground">{formatCurrency(totalOwed)}</strong>
          </p>
        </div>
        <button
          onClick={openNew}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Nova dívida
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg border border-danger/40 bg-danger/10 text-sm text-danger" role="alert">
          {error}
        </div>
      )}

      {isFormOpen && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
          <h3 className="font-semibold">{editingId ? 'Editar dívida' : 'Nova dívida'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="md:col-span-2 text-xs text-muted-foreground space-y-1">
              Descrição
              <input
                value={form.descricao}
                onChange={(event) => setForm({ ...form, descricao: event.target.value })}
                className={inputClass}
                placeholder="Ex.: Tratamento dentário"
              />
            </label>
            <label className="text-xs text-muted-foreground space-y-1">
              Credor
              <input
                value={form.credor}
                onChange={(event) => setForm({ ...form, credor: event.target.value })}
                className={inputClass}
                placeholder="A quem você deve"
              />
            </label>
            <label className="text-xs text-muted-foreground space-y-1">
              Valor total
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.valorTotal || ''}
                onChange={(event) => setForm({ ...form, valorTotal: Number(event.target.value || 0) })}
                className={inputClass}
                placeholder="0,00"
              />
            </label>
            <label className="text-xs text-muted-foreground space-y-1">
              Vencimento (opcional)
              <input
                type="date"
                value={form.vencimento ?? ''}
                onChange={(event) => setForm({ ...form, vencimento: event.target.value })}
                className={inputClass}
              />
            </label>
            <label className="text-xs text-muted-foreground space-y-1">
              Prioridade (opcional)
              <select
                value={form.prioridade ?? ''}
                onChange={(event) =>
                  setForm({ ...form, prioridade: (event.target.value || undefined) as DebtPriority | undefined })
                }
                className={inputClass}
              >
                <option value="">Sem prioridade</option>
                {PRIORIDADES.map((prioridade) => (
                  <option key={prioridade} value={prioridade}>
                    {labelsPrioridade[prioridade]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted-foreground space-y-1">
              Juros (informativo)
              <input
                value={form.jurosInformativo ?? ''}
                onChange={(event) => setForm({ ...form, jurosInformativo: event.target.value })}
                className={inputClass}
                placeholder="Ex.: 2% ao mês"
              />
            </label>
            <label className="text-xs text-muted-foreground space-y-1">
              Parcelas (informativo)
              <input
                value={form.parcelasInformativo ?? ''}
                onChange={(event) => setForm({ ...form, parcelasInformativo: event.target.value })}
                className={inputClass}
                placeholder="Ex.: 10x de R$ 150,00"
              />
            </label>
            <label className="md:col-span-4 text-xs text-muted-foreground space-y-1">
              Observação (opcional)
              <textarea
                value={form.observacao ?? ''}
                onChange={(event) => setForm({ ...form, observacao: event.target.value })}
                className={inputClass}
                rows={2}
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={closeForm}
              className="px-3 py-2 rounded-md border border-border text-sm hover:bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => void handleSave()}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Check size={14} /> Salvar
            </button>
          </div>
        </div>
      )}

      {sortedDebts.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground shadow-sm">
          Nenhuma dívida cadastrada.
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDebts.map((debt) => {
            const remaining = getDebtRemaining(debt, debtPayments);
            const paid = getDebtPaidTotal(debt.id, debtPayments);
            const percent = debt.valorTotal > 0 ? Math.min(100, Math.round((paid / debt.valorTotal) * 100)) : 0;
            const overdue = isDebtOverdue(debt);
            const payments = debtPayments
              .filter((payment) => payment.debtId === debt.id)
              .sort((a, b) => b.data.localeCompare(a.data) || b.createdAt.localeCompare(a.createdAt));
            const isExpanded = expandedId === debt.id;
            const isPaying = payingId === debt.id;

            return (
              <div
                key={debt.id}
                className={`bg-card border rounded-xl shadow-sm ${overdue ? 'border-danger/40' : 'border-border'}`}
              >
                <div className="p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold truncate">{debt.descricao}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {labelsStatus[debt.status]}
                      </span>
                      {debt.prioridade && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          Prioridade {labelsPrioridade[debt.prioridade].toLowerCase()}
                        </span>
                      )}
                      {overdue && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger flex items-center gap-1">
                          <AlertTriangle size={12} /> Vencida
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Credor: {debt.credor}
                      {debt.vencimento ? ` · Vence em ${formatDate(debt.vencimento)}` : ' · Sem vencimento'}
                    </p>
                    {(debt.jurosInformativo || debt.parcelasInformativo) && (
                      <p className="text-xs text-muted-foreground">
                        {[debt.jurosInformativo && `Juros: ${debt.jurosInformativo}`, debt.parcelasInformativo && `Parcelas: ${debt.parcelasInformativo}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                    {debt.observacao && <p className="text-xs text-muted-foreground">{debt.observacao}</p>}
                  </div>

                  <div className="md:text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Restante</p>
                    <p className={`text-xl font-bold ${debt.status === 'quitada' ? 'text-success' : 'text-danger'}`}>
                      {formatCurrency(remaining)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      de {formatCurrency(debt.valorTotal)} · pago {formatCurrency(paid)}
                    </p>
                  </div>
                </div>

                <div className="px-4">
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden" aria-hidden="true">
                    <div className="h-full bg-success rounded-full transition-all" style={{ width: `${percent}%` }} />
                  </div>
                </div>

                <div className="p-4 flex flex-wrap items-center gap-2">
                  {debt.status !== 'quitada' && (
                    <button
                      onClick={() => openPayment(debt)}
                      className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                    >
                      <Wallet size={14} /> Pagar
                    </button>
                  )}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : debt.id)}
                    className="px-3 py-1.5 rounded-md border border-border text-xs hover:bg-secondary transition-colors flex items-center gap-1.5"
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    Histórico ({payments.length})
                  </button>
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() => openEdit(debt)}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                      title="Editar dívida"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => void handleDelete(debt)}
                      className="p-1.5 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                      title="Excluir dívida"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {isPaying && (
                  <div className="px-4 pb-4 space-y-3">
                    {payError && (
                      <div className="px-3 py-2 rounded-lg border border-danger/40 bg-danger/10 text-sm text-danger" role="alert">
                        {payError}
                      </div>
                    )}
                    {contas.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Cadastre uma conta em Cartões para registrar pagamentos de dívidas.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <label className="text-xs text-muted-foreground space-y-1">
                          Valor do pagamento
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={payForm.valor || ''}
                            onChange={(event) => setPayForm({ ...payForm, valor: Number(event.target.value || 0) })}
                            className={inputClass}
                          />
                        </label>
                        <label className="text-xs text-muted-foreground space-y-1">
                          Data
                          <input
                            type="date"
                            value={payForm.data}
                            onChange={(event) => setPayForm({ ...payForm, data: event.target.value })}
                            className={inputClass}
                          />
                        </label>
                        <label className="text-xs text-muted-foreground space-y-1">
                          Conta
                          <select
                            value={payForm.contaId}
                            onChange={(event) => setPayForm({ ...payForm, contaId: event.target.value })}
                            className={inputClass}
                          >
                            <option value="">Selecione</option>
                            {contas.map((conta) => (
                              <option key={conta.id} value={conta.id}>
                                {conta.nome}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPayingId(null)}
                            className="px-3 py-2 rounded-md border border-border text-sm hover:bg-secondary transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => void handlePay(debt)}
                            className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
                          >
                            <Check size={14} /> Confirmar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isExpanded && (
                  <div className="border-t border-border px-4 py-3">
                    {payments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
                    ) : (
                      <ul className="divide-y divide-border">
                        {payments.map((payment) => (
                          <li key={payment.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                            <div>
                              <p className="font-medium">{formatCurrency(payment.valor)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(payment.data)} · {contaNome(payment.contaId)}
                              </p>
                            </div>
                            <button
                              onClick={() => void handleDeletePayment(payment.id)}
                              className="p-1.5 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                              title="Desfazer pagamento"
                            >
                              <Trash2 size={16} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
