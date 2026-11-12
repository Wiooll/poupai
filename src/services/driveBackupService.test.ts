import { afterEach, describe, expect, it, vi } from 'vitest';
import { DriveBackupError, downloadSnapshot, isTokenValid, uploadSnapshot } from './driveBackupService';
import type { DriveToken } from './driveBackupService';
import type { FinanceBackupSnapshot } from '../types';

const token: DriveToken = { accessToken: 'token-teste', expiresAt: Date.now() + 3_600_000 };

const snapshot: FinanceBackupSnapshot = {
  version: '1.0.0',
  exportedAt: '2026-01-02T10:00:00.000Z',
  app: 'PoupAi',
  data: {
    transactions: [],
    categories: [],
    recurringTransactions: [],
    categoryBudgets: [],
    config: { metaEconomiaMensal: 1000, isDarkMode: false },
    contas: [],
    cartoesCredito: [],
    faturaStatuses: [],
    loans: [],
    goals: [],
  },
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('driveBackupService', () => {
  it('retorna null quando não existe arquivo de backup', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ files: [] })));
    await expect(downloadSnapshot(token)).resolves.toBeNull();
  });

  it('baixa e valida o snapshot remoto', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ files: [{ id: 'abc' }] }))
      .mockResolvedValueOnce(jsonResponse(snapshot));
    vi.stubGlobal('fetch', fetchMock);

    await expect(downloadSnapshot(token)).resolves.toEqual(snapshot);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token-teste');
  });

  it('rejeita snapshot remoto inválido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(jsonResponse({ files: [{ id: 'abc' }] })).mockResolvedValueOnce(jsonResponse({ foo: 1 })),
    );
    await expect(downloadSnapshot(token)).rejects.toMatchObject({ kind: 'invalid' });
  });

  it('classifica 401 como erro de autorização não repetível', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })));
    const error = await downloadSnapshot(token).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DriveBackupError);
    expect(error).toMatchObject({ kind: 'auth', retryable: false });
  });

  it('classifica falha de rede como repetível', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')));
    await expect(downloadSnapshot(token)).rejects.toMatchObject({ kind: 'network', retryable: true });
  });

  it('classifica erro 500 como repetível', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));
    await expect(downloadSnapshot(token)).rejects.toMatchObject({ kind: 'http', retryable: true });
  });

  it('cria o arquivo quando não existe e atualiza quando existe', async () => {
    const createMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ files: [] }))
      .mockResolvedValueOnce(jsonResponse({ id: 'novo' }));
    vi.stubGlobal('fetch', createMock);
    await uploadSnapshot(token, snapshot);
    expect((createMock.mock.calls[1] as [string, RequestInit])[1].method).toBe('POST');

    const updateMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ files: [{ id: 'abc' }] }))
      .mockResolvedValueOnce(jsonResponse({ id: 'abc' }));
    vi.stubGlobal('fetch', updateMock);
    await uploadSnapshot(token, snapshot);
    expect((updateMock.mock.calls[1] as [string, RequestInit])[1].method).toBe('PATCH');
  });

  it('valida expiração do token com margem de segurança', () => {
    expect(isTokenValid(token)).toBe(true);
    expect(isTokenValid({ ...token, expiresAt: Date.now() + 30_000 })).toBe(false);
    expect(isTokenValid(null)).toBe(false);
  });
});
