import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { APP_NAME } from '../constants/app';
import { useFinance } from '../context/FinanceContext';
import type { Transaction, TransactionType, PaymentMethod } from '../types';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Filter,
  Layers,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  Camera,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  exportTransactionsCsv,
  exportTransactionsExcel,
  exportTransactionsPdf,
  parseTransactionsCsv,
  type ExportMode,
} from '../utils/transactionImportExport';
import {
  suggestExpenseFromReceiptPhoto,
  validateReceiptPhotoFile,
} from '../utils/receiptPhoto';
import {
  getSavedTransactionsMonthFilter,
  resolveTransactionsMonthFilter,
  saveTransactionsMonthFilter,
} from '../utils/transactionMonthPreference';

const PAYMENT_METHODS: PaymentMethod[] = ['Dinheiro', 'Cartão de crédito', 'Débito', 'PIX'];

const emptyAddForm = (categories: { nome: string }[]): Partial<Transaction> & {
  parcelado: boolean;
  numParcelas: number;
} => ({
  data: new Date().toISOString().split('T')[0],
  tipo: 'despesa',
  formaPagamento: 'PIX',
  valor: 0,
  descricao: '',
  categoria: categories.length > 0 ? categories[0].nome : '',
  contaId: '',
  cartaoId: '',
  parcelado: false,
  numParcelas: 2,
});

const getValidationError = (form: Partial<Transaction> & { parcelado?: boolean; numParcelas?: number }) => {
  if (!form.data || Number.isNaN(parseISO(form.data).getTime())) {
    return 'Informe uma data válida no formato YYYY-MM-DD.';
  }
  if (!form.descricao || form.descricao.trim().length < 2) {
    return 'Informe uma descrição com pelo menos 2 caracteres.';
  }
  if (!form.categoria) {
    return 'Selecione uma categoria.';
  }
  if (!form.tipo) {
    return 'Selecione um tipo de transação.';
  }
  if (!form.formaPagamento) {
    return 'Selecione uma forma de pagamento.';
  }
  if (form.valor === undefined || !Number.isFinite(Number(form.valor)) || Number(form.valor) <= 0) {
    return 'Informe um valor numérico maior que zero.';
  }

  const isCartaoPagamento = form.formaPagamento === 'Cartão de crédito';
  if (isCartaoPagamento && !form.cartaoId) {
    return 'Selecione o cartão de crédito para esta transação.';
  }
  if (!isCartaoPagamento && !form.contaId) {
    return 'Selecione a conta para esta transação.';
  }

  if (form.parcelado && (!form.numParcelas || form.numParcelas < 2 || form.numParcelas > 48)) {
    return 'Número de parcelas inválido. Use entre 2 e 48.';
  }

  return '';
};

const getExportFileBase = (mode: ExportMode) => {
  const now = format(new Date(), 'yyyyMMdd_HHmm');
  return `${APP_NAME.toLowerCase()}_${mode}_${now}`;
};

const genericSaveError = 'Não foi possível salvar os dados agora. Tente novamente.';

export const TransactionsTable = () => {
  const {
    transactions,
    categories,
    contas,
    cartoesCredito,
    addTransaction,
    addParcelado,
    updateTransaction,
    deleteTransaction,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterMes, setFilterMes] = useState<string>(() =>
    resolveTransactionsMonthFilter(getSavedTransactionsMonthFilter()),
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm(categories));
  const [formError, setFormError] = useState('');
  const [importFeedback, setImportFeedback] = useState('');
  const [receiptFeedback, setReceiptFeedback] = useState('');
  const [exportMode, setExportMode] = useState<ExportMode>('detalhado');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const mesesOptions = useMemo(() => {
    const meses = new Set<string>();
    transactions.forEach((t) => {
      const data = parseISO(t.data);
      if (!isNaN(data.getTime())) {
        meses.add(t.data.substring(0, 7));
      }
    });
    return Array.from(meses).sort().reverse();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchSearch =
          t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.categoria.toLowerCase().includes(searchTerm.toLowerCase());
        const matchTipo = filterTipo === 'todos' || t.tipo === filterTipo;
        const matchMes = filterMes === 'todos' || t.data.startsWith(filterMes);
        return matchSearch && matchTipo && matchMes;
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [transactions, searchTerm, filterTipo, filterMes]);

  useEffect(() => {
    saveTransactionsMonthFilter(filterMes);
  }, [filterMes]);

  const handleEditClick = (t: Transaction) => {
    setEditingId(t.id);
    setEditForm(t);
  };

  const handleEditSave = async () => {
    if (editingId && editForm) {
      const error = getValidationError({ ...editForm, parcelado: false });
      if (error) {
        setFormError(error);
        return;
      }
      try {
        await updateTransaction(editingId, editForm);
        setEditingId(null);
        setFormError('');
      } catch {
        setFormError(genericSaveError);
      }
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAddSave = async () => {
    const error = getValidationError(addForm);
    if (error) {
      setFormError(error);
      return;
    }

    // Monta o objeto sem incluir campos opcionais com valor undefined,
    // para manter o registro limpo no armazenamento local e no backup JSON.
    const isCartaoPagamento = addForm.formaPagamento === 'Cartão de crédito';
    const base: Omit<Transaction, 'id' | 'parcelaAtual' | 'totalParcelas' | 'parcelaGrupoId'> = {
      data: addForm.data!,
      descricao: addForm.descricao!,
      categoria: addForm.categoria!,
      tipo: addForm.tipo as TransactionType,
      valor: Number(addForm.valor),
      formaPagamento: addForm.formaPagamento as PaymentMethod,
      ...(isCartaoPagamento && addForm.cartaoId ? { cartaoId: addForm.cartaoId } : {}),
      ...(!isCartaoPagamento && addForm.contaId ? { contaId: addForm.contaId } : {}),
    };

    try {
      if (addForm.parcelado && addForm.numParcelas && addForm.numParcelas >= 2) {
        await addParcelado(base, addForm.numParcelas);
      } else {
        await addTransaction(base);
      }

      setIsAdding(false);
      setAddForm(emptyAddForm(categories));
      setFormError('');
    } catch {
      setFormError(genericSaveError);
    }
  };

  const handleDeleteTransaction = async (t: Transaction) => {
    if (t.parcelaGrupoId) {
      const grupo = transactions.filter((tx) => tx.parcelaGrupoId === t.parcelaGrupoId);
      if (grupo.length > 1) {
        const resposta = confirm(
          `Esta é uma compra parcelada (${t.parcelaAtual}/${t.totalParcelas}).\n` +
          `Deseja excluir apenas esta parcela ou todas as ${grupo.length} parcelas?`,
        );
        if (resposta) {
          // Excluir todas as parcelas do grupo
          await Promise.all(grupo.map((tx) => deleteTransaction(tx.id)));
          return;
        }
      }
    }
    try {
      await deleteTransaction(t.id);
    } catch {
      setFormError('Não foi possível excluir a transação.');
    }
  };

  const handleImportCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    const result = parseTransactionsCsv(content);

    if (result.validTransactions.length > 0) {
      try {
        await Promise.all(result.validTransactions.map((transaction) => addTransaction(transaction)));
      } catch {
        setImportFeedback('Falha ao persistir as transações importadas. Tente novamente.');
        event.target.value = '';
        return;
      }
    }

    const successCount = result.validTransactions.length;
    const errorCount = result.errors.length;
    const firstErrors = result.errors.slice(0, 5).map((err) => `Linha ${err.line}: ${err.message}`);
    setImportFeedback(
      errorCount === 0
        ? `Importação concluída com sucesso. ${successCount} transações importadas.`
        : `Importação concluída com ${successCount} transações importadas e ${errorCount} erros. ${firstErrors.join(' | ')}`,
    );

    event.target.value = '';
  };

  const handleReceiptPhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFormError('');
    setReceiptFeedback('');

    const validationError = validateReceiptPhotoFile(file);
    if (validationError) {
      setFormError(validationError);
      event.target.value = '';
      return;
    }

    try {
      const suggestion = await suggestExpenseFromReceiptPhoto(file);
      setIsAdding(true);
      setAddForm({
        ...emptyAddForm(categories),
        tipo: 'despesa',
        formaPagamento: 'PIX',
        descricao: suggestion.descricao,
        categoria: categories.length > 0 ? categories[0].nome : '',
        valor: suggestion.valor,
        data: suggestion.data,
      });
      setReceiptFeedback(
        'Sugestão aplicada a partir da foto. Revise os campos antes de salvar a transação.',
      );
    } catch (error) {
      console.error('Falha ao processar nota fiscal por foto', error);
      setIsAdding(true);
      setAddForm(emptyAddForm(categories));
      setFormError(
        'Não foi possível extrair os dados da nota fiscal. Preencha manualmente e tente novamente.',
      );
    } finally {
      event.target.value = '';
    }
  };

  const handleExport = (formatType: 'csv' | 'excel' | 'pdf') => {
    const baseFileName = getExportFileBase(exportMode);

    if (formatType === 'csv') {
      exportTransactionsCsv(filteredTransactions, exportMode, `${baseFileName}.csv`);
      return;
    }

    if (formatType === 'excel') {
      exportTransactionsExcel(filteredTransactions, exportMode, `${baseFileName}.xls`);
      return;
    }

    try {
      exportTransactionsPdf(filteredTransactions, exportMode);
    } catch {
      setFormError('Não foi possível gerar o PDF.');
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const isCartao = (fp: PaymentMethod | string | undefined) => fp === 'Cartão de crédito';

  const fieldCls =
    'w-full bg-background border border-input rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-ring';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Transações</h2>
        <div className="flex flex-wrap gap-2 justify-end">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => void handleImportCsv(event)}
          />
          <input
            ref={receiptInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void handleReceiptPhotoUpload(event)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-lg border border-border bg-background hover:bg-secondary text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Upload size={15} /> Importar CSV
          </button>
          <button
            onClick={() => receiptInputRef.current?.click()}
            className="px-3 py-2 rounded-lg border border-border bg-background hover:bg-secondary text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Camera size={15} /> Nota por foto
          </button>
          <select
            value={exportMode}
            onChange={(event) => setExportMode(event.target.value as ExportMode)}
            className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
          >
            <option value="detalhado">Exportação detalhada</option>
            <option value="resumo">Exportação resumo</option>
          </select>
          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-2 rounded-lg border border-border bg-background hover:bg-secondary text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Download size={15} /> CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-3 py-2 rounded-lg border border-border bg-background hover:bg-secondary text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet size={15} /> Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="px-3 py-2 rounded-lg border border-border bg-background hover:bg-secondary text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <FileText size={15} /> PDF
          </button>
          <button
            onClick={() => {
              setIsAdding(true);
              setAddForm(emptyAddForm(categories));
              setFormError('');
              setReceiptFeedback('');
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Nova Transação
          </button>
        </div>
      </div>

      {importFeedback && (
        <div className="px-4 py-3 rounded-lg border border-primary/30 bg-primary/10 text-sm text-foreground">
          {importFeedback}
        </div>
      )}

      {receiptFeedback && (
        <div className="px-4 py-3 rounded-lg border border-success/30 bg-success/10 text-sm text-foreground">
          {receiptFeedback}
        </div>
      )}

      {formError && (
        <div className="px-4 py-3 rounded-lg border border-danger/40 bg-danger/10 text-sm text-danger">
          {formError}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Filtros */}
        <div className="p-4 border-b border-border bg-secondary/30 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Buscar por descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
          </div>

          <div className="flex w-full md:w-auto gap-4 items-center flex-1 md:justify-end">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted-foreground" />
              <select
                value={filterMes}
                onChange={(e) => setFilterMes(e.target.value)}
                className="bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="todos">Todos os Meses</option>
                {mesesOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
              <option value="transferencia">Transferências</option>
            </select>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Pagamento</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {/* Linha de adição */}
              {isAdding && (
                <tr className="border-b border-border bg-primary/5 animate-in fade-in">
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      value={addForm.data}
                      onChange={(e) => setAddForm({ ...addForm, data: e.target.value })}
                      className={fieldCls}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        placeholder="Descrição"
                        value={addForm.descricao}
                        onChange={(e) => setAddForm({ ...addForm, descricao: e.target.value })}
                        className={fieldCls}
                      />
                      {/* Parcelamento */}
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addForm.parcelado}
                          onChange={(e) => setAddForm({ ...addForm, parcelado: e.target.checked })}
                          className="rounded"
                        />
                        <Layers size={11} />
                        Parcelado
                        {addForm.parcelado && (
                          <span className="flex items-center gap-1 ml-1">
                            em
                            <input
                              type="number"
                              min="2"
                              max="48"
                              value={addForm.numParcelas}
                              onChange={(e) =>
                                setAddForm({ ...addForm, numParcelas: Math.max(2, Math.min(48, parseInt(e.target.value) || 2)) })
                              }
                              className="w-12 border border-input rounded px-1 py-0.5 text-xs bg-background focus:ring-1 focus:ring-ring"
                            />
                            x
                          </span>
                        )}
                      </label>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={addForm.categoria}
                      onChange={(e) => setAddForm({ ...addForm, categoria: e.target.value })}
                      className={fieldCls}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.nome}>{c.nome}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={addForm.tipo}
                      onChange={(e) => setAddForm({ ...addForm, tipo: e.target.value as TransactionType })}
                      className={fieldCls}
                    >
                      <option value="despesa">Despesa</option>
                      <option value="receita">Receita</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <select
                        value={addForm.formaPagamento}
                        onChange={(e) =>
                          setAddForm({
                            ...addForm,
                            formaPagamento: e.target.value as PaymentMethod,
                            cartaoId: '',
                            contaId: '',
                          })
                        }
                        className={fieldCls}
                      >
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      {/* Conta ou Cartão */}
                      {isCartao(addForm.formaPagamento) && cartoesCredito.length > 0 && (
                        <select
                          value={addForm.cartaoId}
                          onChange={(e) => setAddForm({ ...addForm, cartaoId: e.target.value })}
                          className={fieldCls}
                        >
                          <option value="">Selecionar cartão...</option>
                          {cartoesCredito.map((c) => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                          ))}
                        </select>
                      )}
                      {!isCartao(addForm.formaPagamento) && contas.length > 0 && (
                        <select
                          value={addForm.contaId}
                          onChange={(e) => setAddForm({ ...addForm, contaId: e.target.value })}
                          className={fieldCls}
                        >
                          <option value="">Selecionar conta...</option>
                          {contas.map((c) => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={addForm.valor || ''}
                      onChange={(e) => setAddForm({ ...addForm, valor: parseFloat(e.target.value) })}
                      className={fieldCls}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={handleAddSave}
                        className="p-1.5 text-success hover:bg-success/10 rounded-md transition-colors"
                        title="Salvar"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setIsAdding(false)}
                        className="p-1.5 text-danger hover:bg-danger/10 rounded-md transition-colors"
                        title="Cancelar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Sem resultados */}
              {filteredTransactions.length === 0 && !isAdding ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-border hover:bg-secondary/30 transition-colors group"
                  >
                    {editingId === t.id ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={editForm.data}
                            onChange={(e) => setEditForm({ ...editForm, data: e.target.value })}
                            className={fieldCls}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editForm.descricao}
                            onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
                            className={fieldCls}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={editForm.categoria}
                            onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })}
                            className={fieldCls}
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.nome}>{c.nome}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={editForm.tipo}
                            onChange={(e) =>
                              setEditForm({ ...editForm, tipo: e.target.value as TransactionType })
                            }
                            className={fieldCls}
                          >
                            <option value="despesa">Despesa</option>
                            <option value="receita">Receita</option>
                            <option value="transferencia">Transferência</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={editForm.formaPagamento}
                            onChange={(e) =>
                              setEditForm({ ...editForm, formaPagamento: e.target.value as PaymentMethod })
                            }
                            className={fieldCls}
                          >
                            {PAYMENT_METHODS.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.valor}
                            onChange={(e) =>
                              setEditForm({ ...editForm, valor: parseFloat(e.target.value) })
                            }
                            className={fieldCls}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={handleEditSave}
                              className="p-1.5 text-success hover:bg-success/10 rounded-md transition-colors"
                              title="Salvar"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="p-1.5 text-danger hover:bg-danger/10 rounded-md transition-colors"
                              title="Cancelar"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-muted-foreground font-medium">
                          {(() => {
                            try { return format(parseISO(t.data), 'dd/MM/yyyy'); }
                            catch { return t.data; }
                          })()}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          <span>{t.descricao}</span>
                          {t.totalParcelas && (
                            <span className="ml-1.5 text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5 font-mono">
                              {t.parcelaAtual}/{t.totalParcelas}
                            </span>
                          )}
                          {t.tipo === 'transferencia' && (
                            <span className="ml-1.5 text-xs bg-secondary text-muted-foreground rounded px-1.5 py-0.5">
                              {t.isTransferenciaOrigem ? '↑ Saída' : '↓ Entrada'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                            {t.categoria}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              t.tipo === 'receita'
                                ? 'bg-success/10 text-success border border-success/20'
                                : t.tipo === 'transferencia'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                : 'bg-danger/10 text-danger border border-danger/20'
                            }`}
                          >
                            {t.tipo === 'receita' ? 'Receita' : t.tipo === 'transferencia' ? 'Transferência' : 'Despesa'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          <div>{t.formaPagamento}</div>
                          {t.cartaoId && cartoesCredito.find((c) => c.id === t.cartaoId) && (
                            <div className="text-primary/70 mt-0.5">
                              {cartoesCredito.find((c) => c.id === t.cartaoId)?.nome}
                            </div>
                          )}
                          {t.contaId && contas.find((c) => c.id === t.contaId) && (
                            <div className="text-muted-foreground/70 mt-0.5">
                              {contas.find((c) => c.id === t.contaId)?.nome}
                            </div>
                          )}
                        </td>
                        <td
                          className={`px-4 py-3 font-bold ${
                            t.tipo === 'receita' || (t.tipo === 'transferencia' && !t.isTransferenciaOrigem)
                              ? 'text-success'
                              : 'text-danger'
                          }`}
                        >
                          {t.tipo === 'receita' || (t.tipo === 'transferencia' && !t.isTransferenciaOrigem)
                            ? '+ '
                            : '- '}
                          {formatCurrency(t.valor)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditClick(t)}
                              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(t)}
                              className="p-1.5 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
