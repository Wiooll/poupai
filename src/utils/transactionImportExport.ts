import { format, parseISO } from 'date-fns';
import { APP_NAME } from '../constants/app';
import type { PaymentMethod, Transaction, TransactionType } from '../types';

export type ExportMode = 'resumo' | 'detalhado';

export interface ImportError {
  line: number;
  message: string;
}

export interface ImportResult {
  validTransactions: Omit<Transaction, 'id'>[];
  errors: ImportError[];
}

interface ExportRow {
  data: string;
  descricao: string;
  categoria: string;
  tipo: string;
  formaPagamento: string;
  valor: string;
  quantidade?: string;
}

const PAYMENT_METHODS: PaymentMethod[] = ['Dinheiro', 'Cartão de crédito', 'Débito', 'PIX'];
const TRANSACTION_TYPES: TransactionType[] = ['receita', 'despesa', 'transferencia'];

const normalizeHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const normalizeMoney = (value: string) => {
  const sanitized = value.trim().replace(/\./g, '').replace(',', '.');
  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const parseCsvLine = (line: string, separator: string) => {
  const fields: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const nextChar = line[i + 1];
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === separator && !insideQuotes) {
      fields.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  fields.push(current.trim());
  return fields;
};

const detectSeparator = (headerLine: string) => {
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
};

const getHeaderIndex = (headers: string[], aliases: string[]) => {
  const normalizedAliases = aliases.map(normalizeHeader);
  return headers.findIndex((header) => normalizedAliases.includes(normalizeHeader(header)));
};

export const parseTransactionsCsv = (content: string): ImportResult => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return {
      validTransactions: [],
      errors: [{ line: 0, message: 'Arquivo CSV vazio ou sem linhas de dados.' }],
    };
  }

  const separator = detectSeparator(lines[0]);
  const headers = parseCsvLine(lines[0], separator);

  const indexes = {
    data: getHeaderIndex(headers, ['data', 'date']),
    descricao: getHeaderIndex(headers, ['descricao', 'descrição', 'description']),
    categoria: getHeaderIndex(headers, ['categoria', 'category']),
    tipo: getHeaderIndex(headers, ['tipo', 'type']),
    valor: getHeaderIndex(headers, ['valor', 'value', 'amount']),
    formaPagamento: getHeaderIndex(headers, [
      'formapagamento',
      'forma_pagamento',
      'forma pagamento',
      'pagamento',
      'payment',
    ]),
  };

  const missingRequired = Object.entries(indexes)
    .filter(([key, value]) => key !== 'formaPagamento' && value < 0)
    .map(([key]) => key);

  if (missingRequired.length > 0) {
    return {
      validTransactions: [],
      errors: [
        {
          line: 1,
          message: `Cabeçalho inválido. Campos obrigatórios ausentes: ${missingRequired.join(', ')}.`,
        },
      ],
    };
  }

  const validTransactions: Omit<Transaction, 'id'>[] = [];
  const errors: ImportError[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const lineNumber = i + 1;
    const cells = parseCsvLine(lines[i], separator);

    const data = cells[indexes.data]?.trim();
    const descricao = cells[indexes.descricao]?.trim();
    const categoria = cells[indexes.categoria]?.trim();
    const tipoRaw = cells[indexes.tipo]?.trim().toLowerCase();
    const valorRaw = cells[indexes.valor]?.trim();
    const formaPagamentoRaw = indexes.formaPagamento >= 0 ? cells[indexes.formaPagamento]?.trim() : '';
    const valor = normalizeMoney(valorRaw || '');
    const tipo = (tipoRaw || '') as TransactionType;
    const formaPagamento = (formaPagamentoRaw || 'PIX') as PaymentMethod;

    if (!data || Number.isNaN(parseISO(data).getTime())) {
      errors.push({ line: lineNumber, message: 'Data inválida. Use o formato YYYY-MM-DD.' });
      continue;
    }

    if (!descricao) {
      errors.push({ line: lineNumber, message: 'Descrição obrigatória.' });
      continue;
    }

    if (!categoria) {
      errors.push({ line: lineNumber, message: 'Categoria obrigatória.' });
      continue;
    }

    if (!TRANSACTION_TYPES.includes(tipo)) {
      errors.push({
        line: lineNumber,
        message: 'Tipo inválido. Valores aceitos: receita, despesa ou transferência.',
      });
      continue;
    }

    if (!Number.isFinite(valor) || valor <= 0) {
      errors.push({ line: lineNumber, message: 'Valor inválido. Informe número maior que zero.' });
      continue;
    }

    if (!PAYMENT_METHODS.includes(formaPagamento)) {
      errors.push({
        line: lineNumber,
        message: 'Forma de pagamento inválida. Valores aceitos: Dinheiro, Cartão de crédito, Débito ou PIX.',
      });
      continue;
    }

    validTransactions.push({
      data,
      descricao,
      categoria,
      tipo,
      valor,
      formaPagamento,
    });
  }

  return { validTransactions, errors };
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const escapeCsvCell = (value: string) => {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const getDetailedRows = (transactions: Transaction[]): ExportRow[] =>
  transactions.map((transaction) => ({
    data: transaction.data,
    descricao: transaction.descricao,
    categoria: transaction.categoria,
    tipo: transaction.tipo,
    formaPagamento: transaction.formaPagamento,
    valor: String(transaction.valor),
  }));

const getSummaryRows = (transactions: Transaction[]): ExportRow[] => {
  const grouped = new Map<string, { categoria: string; tipo: string; total: number; quantidade: number }>();

  transactions.forEach((transaction) => {
    const key = `${transaction.tipo}::${transaction.categoria}`;
    const current = grouped.get(key) || {
      categoria: transaction.categoria,
      tipo: transaction.tipo,
      total: 0,
      quantidade: 0,
    };
    current.total += Number(transaction.valor);
    current.quantidade += 1;
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .sort((a, b) => b.total - a.total)
    .map((item) => ({
      data: '-',
      descricao: 'Resumo por categoria',
      categoria: item.categoria,
      tipo: item.tipo,
      formaPagamento: '-',
      valor: String(item.total),
      quantidade: String(item.quantidade),
    }));
};

export const buildExportRows = (transactions: Transaction[], mode: ExportMode): ExportRow[] =>
  mode === 'resumo' ? getSummaryRows(transactions) : getDetailedRows(transactions);

const getExportHeaders = (mode: ExportMode) =>
  mode === 'resumo'
    ? ['Data', 'Descrição', 'Categoria', 'Tipo', 'Forma de pagamento', 'Quantidade', 'Valor']
    : ['Data', 'Descrição', 'Categoria', 'Tipo', 'Forma de pagamento', 'Valor'];

export const exportTransactionsCsv = (transactions: Transaction[], mode: ExportMode, fileName: string) => {
  const rows = buildExportRows(transactions, mode);
  const headers = getExportHeaders(mode);

  const csvRows = rows.map((row) => {
    const values =
      mode === 'resumo'
        ? [row.data, row.descricao, row.categoria, row.tipo, row.formaPagamento, row.quantidade || '0', row.valor]
        : [row.data, row.descricao, row.categoria, row.tipo, row.formaPagamento, row.valor];

    return values.map((value) => escapeCsvCell(String(value))).join(';');
  });

  const csvContent = [headers.join(';'), ...csvRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, fileName);
};

export const exportTransactionsExcel = (
  transactions: Transaction[],
  mode: ExportMode,
  fileName: string,
) => {
  const rows = buildExportRows(transactions, mode);
  const headers = getExportHeaders(mode);

  const tableRows = rows
    .map((row) => {
      const values =
        mode === 'resumo'
          ? [
              row.data,
              row.descricao,
              row.categoria,
              row.tipo,
              row.formaPagamento,
              row.quantidade || '0',
              formatCurrency(Number(row.valor)),
            ]
          : [
              row.data,
              row.descricao,
              row.categoria,
              row.tipo,
              row.formaPagamento,
              formatCurrency(Number(row.valor)),
            ];
      return `<tr>${values.map((value) => `<td>${value}</td>`).join('')}</tr>`;
    })
    .join('');

  const htmlTable = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8" /></head>
      <body>
        <table border="1">
          <thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  downloadBlob(blob, fileName);
};

export const exportTransactionsPdf = (transactions: Transaction[], mode: ExportMode) => {
  const rows = buildExportRows(transactions, mode);
  const headers = getExportHeaders(mode);

  const printableRows = rows
    .map((row) => {
      const values =
        mode === 'resumo'
          ? [
              row.data,
              row.descricao,
              row.categoria,
              row.tipo,
              row.formaPagamento,
              row.quantidade || '0',
              formatCurrency(Number(row.valor)),
            ]
          : [
              row.data,
              row.descricao,
              row.categoria,
              row.tipo,
              row.formaPagamento,
              formatCurrency(Number(row.valor)),
            ];
      return `<tr>${values.map((value) => `<td style="padding:8px;border:1px solid #ddd">${value}</td>`).join('')}</tr>`;
    })
    .join('');

  const popup = window.open('', '_blank', 'width=1000,height=700');
  if (!popup) {
    throw new Error('Não foi possível abrir a janela de impressão para gerar o PDF.');
  }

  popup.document.write(`
    <html>
      <head>
        <title>Relatório ${APP_NAME}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; color: #111; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          p { margin: 0 0 12px 0; color: #555; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { text-align: left; border: 1px solid #ddd; background: #f3f3f3; padding: 8px; }
        </style>
      </head>
      <body>
        <h1>${APP_NAME} - Exportação ${mode === 'resumo' ? 'Resumo' : 'Detalhada'}</h1>
        <p>Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        <table>
          <thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead>
          <tbody>${printableRows}</tbody>
        </table>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
};
