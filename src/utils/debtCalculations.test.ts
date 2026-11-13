import { describe, expect, it } from 'vitest';
import type { Debt, DebtPayment } from '../types';
import {
  getDebtRemaining,
  getDebtStatus,
  getTotalOwed,
  isDebtOverdue,
  roundMoney,
} from './debtCalculations';
import { validateDebtInput, validateDebtPayment } from './debtValidation';

const baseDebt = (overrides: Partial<Debt> = {}): Debt => ({
  id: 'd1',
  descricao: 'Dentista',
  credor: 'Clínica',
  valorTotal: 1000,
  status: 'pendente',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const payment = (valor: number, debtId = 'd1', id = `p${valor}`): DebtPayment => ({
  id,
  debtId,
  valor,
  data: '2026-02-01',
  contaId: 'c1',
  transactionId: `t${id}`,
  createdAt: '2026-02-01T00:00:00.000Z',
});

describe('debtCalculations', () => {
  it('sem pagamentos: restante igual ao total e status pendente', () => {
    const debt = baseDebt();
    expect(getDebtRemaining(debt, [])).toBe(1000);
    expect(getDebtStatus(debt, [])).toBe('pendente');
  });

  it('pagamento parcial: status parcial', () => {
    const debt = baseDebt();
    expect(getDebtRemaining(debt, [payment(250)])).toBe(750);
    expect(getDebtStatus(debt, [payment(250)])).toBe('parcial');
  });

  it('quitação: restante zero e status quitada', () => {
    const debt = baseDebt();
    const payments = [payment(400, 'd1', 'a'), payment(600, 'd1', 'b')];
    expect(getDebtRemaining(debt, payments)).toBe(0);
    expect(getDebtStatus(debt, payments)).toBe('quitada');
  });

  it('ignora pagamentos de outras dívidas', () => {
    expect(getDebtRemaining(baseDebt(), [payment(300, 'outra')])).toBe(1000);
  });

  it('evita resíduo de ponto flutuante nos centavos', () => {
    const debt = baseDebt({ valorTotal: 0.3 });
    const payments = [payment(0.1, 'd1', 'a'), payment(0.2, 'd1', 'b')];
    expect(getDebtRemaining(debt, payments)).toBe(0);
    expect(getDebtStatus(debt, payments)).toBe('quitada');
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });

  it('vencida somente quando não quitada e vencimento passou', () => {
    const hoje = new Date(2026, 5, 10);
    expect(isDebtOverdue({ vencimento: '2026-06-09', status: 'pendente' }, hoje)).toBe(true);
    expect(isDebtOverdue({ vencimento: '2026-06-10', status: 'pendente' }, hoje)).toBe(false);
    expect(isDebtOverdue({ vencimento: '2026-06-09', status: 'quitada' }, hoje)).toBe(false);
    expect(isDebtOverdue({ vencimento: undefined, status: 'pendente' }, hoje)).toBe(false);
  });

  it('total devido soma apenas dívidas não quitadas', () => {
    const debts = [
      baseDebt({ id: 'd1', valorTotal: 1000, status: 'parcial' }),
      baseDebt({ id: 'd2', valorTotal: 500, status: 'pendente' }),
      baseDebt({ id: 'd3', valorTotal: 300, status: 'quitada' }),
    ];
    const payments = [payment(250, 'd1'), payment(300, 'd3')];
    expect(getTotalOwed(debts, payments)).toBe(1250);
    expect(getTotalOwed([], [])).toBe(0);
  });
});

describe('debtValidation', () => {
  const valid = {
    descricao: 'Dentista',
    credor: 'Clínica',
    valorTotal: 100,
    vencimento: '2026-12-01',
  };

  it('aceita dívida válida', () => {
    expect(validateDebtInput(valid)).toBe('');
  });

  it('rejeita descrição curta, credor vazio, valor inválido e vencimento inválido', () => {
    expect(validateDebtInput({ ...valid, descricao: 'ab' })).not.toBe('');
    expect(validateDebtInput({ ...valid, credor: '' })).not.toBe('');
    expect(validateDebtInput({ ...valid, valorTotal: 0 })).not.toBe('');
    expect(validateDebtInput({ ...valid, vencimento: 'xx' })).not.toBe('');
  });

  it('valida pagamento: conta, data, valor e limite do saldo', () => {
    const ok = { valor: 100, data: '2026-02-01', contaId: 'c1' };
    expect(validateDebtPayment(ok, 100)).toBe('');
    expect(validateDebtPayment({ ...ok, contaId: '' }, 100)).not.toBe('');
    expect(validateDebtPayment({ ...ok, data: '' }, 100)).not.toBe('');
    expect(validateDebtPayment({ ...ok, valor: 0 }, 100)).not.toBe('');
    expect(validateDebtPayment({ ...ok, valor: 100.01 }, 100)).not.toBe('');
  });
});
