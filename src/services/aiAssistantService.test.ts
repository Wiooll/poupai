import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractJsonFromText,
  formatAIErrorMessage,
  testAIConnection,
  GEMINI_FALLBACK_MODELS,
  filterOpenAIChatModels,
  filterGeminiChatModels,
  listAvailableModels,
  resolveModel,
  normalizeTransactionProposal,
  getLocalDateString,
} from './aiAssistantService';
import type { Categoria, Conta, CartaoCredito } from '../types';

describe('aiAssistantService', () => {
  describe('extractJsonFromText', () => {
    it('deve extrair JSON válido direto', () => {
      const input = '{"type":"QUERY_RESPONSE","replyText":"Saldo de R$ 500"}';
      const result = extractJsonFromText(input) as { type: string; replyText: string };
      expect(result.type).toBe('QUERY_RESPONSE');
      expect(result.replyText).toBe('Saldo de R$ 500');
    });

    it('deve extrair JSON envelopado em bloco de código markdown ```json ... ```', () => {
      const input = '```json\n{\n  "type": "ACTION_PROPOSAL",\n  "action": "ADD_TRANSACTION"\n}\n```';
      const result = extractJsonFromText(input) as { type: string; action: string };
      expect(result.type).toBe('ACTION_PROPOSAL');
      expect(result.action).toBe('ADD_TRANSACTION');
    });

    it('deve extrair JSON quando houver texto explicativo antes ou depois', () => {
      const input = 'Com certeza! Segue a sua solicitação:\n{"type":"QUERY_RESPONSE","replyText":"Tudo certo!"}\nEspero ter ajudado.';
      const result = extractJsonFromText(input) as { type: string; replyText: string };
      expect(result.type).toBe('QUERY_RESPONSE');
      expect(result.replyText).toBe('Tudo certo!');
    });

    it('deve lançar erro quando não houver JSON válido no conteúdo', () => {
      expect(() => extractJsonFromText('Apenas uma resposta em texto sem formato JSON')).toThrow();
      expect(() => extractJsonFromText('')).toThrow();
    });
  });

  describe('formatAIErrorMessage', () => {
    it('deve formatar erro de chave inválida (400 / API_KEY_INVALID)', () => {
      const err = new Error('API key not valid. Please pass a valid API key.');
      const formatted = formatAIErrorMessage(err);
      expect(formatted).toContain('Chave de API inválida');
    });

    it('deve formatar erro de autorização ou cota (429 / RESOURCE_EXHAUSTED)', () => {
      const err = new Error('Erro HTTP: 429 - Resource has been exhausted (e.g. check quota)');
      const formatted = formatAIErrorMessage(err);
      expect(formatted).toContain('Limite de requisições ou cota');
    });

    it('deve formatar erro de modelo não encontrado (404)', () => {
      const err = new Error('models/gemini-3.8-flash is not found for API version v1beta');
      const formatted = formatAIErrorMessage(err);
      expect(formatted).toContain('O modelo de IA solicitado não está disponível');
    });

    it('deve formatar erro de alta demanda / indisponibilidade temporária (503)', () => {
      const err = new Error('This model is currently experiencing high demand. Spikes in demand are usually temporary.');
      const formatted = formatAIErrorMessage(err);
      expect(formatted).toContain('alta demanda');
      expect(formatted).toContain('escolha outro modelo');
    });

    it('deve formatar erro de rede / Failed to fetch', () => {
      const err = new Error('TypeError: Failed to fetch');
      const formatted = formatAIErrorMessage(err);
      expect(formatted).toContain('Falha de conexão com o provedor de IA');
    });
  });

  describe('testAIConnection', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('deve retornar falha se a chave não estiver preenchida', async () => {
      const result = await testAIConnection({ aiApiKey: '', aiProvider: 'gemini' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('informe a chave de API');
    });

    it('deve testar conexão com sucesso no Gemini via modelo fallback se o primeiro falhar com 404', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        callCount++;
        if (url.includes(GEMINI_FALLBACK_MODELS[0])) {
          return {
            ok: false,
            status: 404,
            json: async () => ({ error: { message: 'Not found' } }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: '{"status":"ok"}' }] } }],
          }),
        };
      }) as unknown as typeof fetch;

      const result = await testAIConnection({ aiApiKey: 'dummy_key', aiProvider: 'gemini' });
      expect(result.success).toBe(true);
      expect(result.modelUsed).toBe(GEMINI_FALLBACK_MODELS[1]);
      expect(callCount).toBe(2);
    });

    it('deve usar o modelo escolhido no Gemini sem fallback', async () => {
      const urls: string[] = [];
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        urls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ candidates: [{ content: { parts: [{ text: '{"status":"ok"}' }] } }] }),
        };
      }) as unknown as typeof fetch;

      const result = await testAIConnection({
        aiApiKey: 'dummy_key',
        aiProvider: 'gemini',
        aiModel: 'gemini-2.5-pro',
      });
      expect(result.success).toBe(true);
      expect(result.modelUsed).toBe('gemini-2.5-pro');
      expect(urls).toHaveLength(1);
      expect(urls[0]).toContain('gemini-2.5-pro');
    });

    it('deve usar o modelo escolhido na OpenAI', async () => {
      let sentModel = '';
      globalThis.fetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
        sentModel = JSON.parse(init.body as string).model;
        return { ok: true, status: 200, json: async () => ({}) };
      }) as unknown as typeof fetch;

      const result = await testAIConnection({
        aiApiKey: 'dummy_key',
        aiProvider: 'openai',
        aiModel: 'gpt-4o-mini',
      });
      expect(result.success).toBe(true);
      expect(sentModel).toBe('gpt-4o-mini');
    });
  });

  describe('normalizeTransactionProposal', () => {
    const refs = {
      categories: [{ id: '1', nome: 'Alimentação', tipo: 'despesa' }] as Categoria[],
      accounts: [{ id: 'c1', nome: 'Conta' }] as Conta[],
      cards: [{ id: 'k1', nome: 'Cartão', limite: 1000 }] as CartaoCredito[],
      today: '2026-11-12',
    };

    it('deve normalizar tipo, forma de pagamento, valor e categoria', () => {
      const result = normalizeTransactionProposal(
        { descricao: ' Almoço ', valor: '12,50', tipo: 'Despesa', formaPagamento: 'pix', categoria: 'alimentacao', data: '2026-11-10' },
        refs
      );
      expect(result).toEqual({
        ok: true,
        data: { data: '2026-11-10', descricao: 'Almoço', categoria: 'Alimentação', tipo: 'despesa', valor: 12.5, formaPagamento: 'PIX' },
      });
    });

    it('deve usar a data de hoje quando a data for inválida ou ausente', () => {
      const a = normalizeTransactionProposal({ descricao: 'x', valor: 1, tipo: 'despesa', categoria: 'Alimentação', data: '10/11/2026' }, refs);
      const b = normalizeTransactionProposal({ descricao: 'x', valor: 1, tipo: 'despesa', categoria: 'Alimentação', data: '2026-02-31' }, refs);
      const c = normalizeTransactionProposal({ descricao: 'x', valor: 1, tipo: 'despesa', categoria: 'Alimentação' }, refs);
      for (const r of [a, b, c]) {
        expect(r.ok && r.data.data).toBe('2026-11-12');
      }
    });

    it('deve omitir conta/cartão inexistentes e descartar id e userId', () => {
      const result = normalizeTransactionProposal(
        { id: 'abc', userId: 'u', descricao: 'x', valor: 5, tipo: 'receita', categoria: 'Salário', formaPagamento: 'Débito', contaId: 'nao-existe', cartaoId: 'k1' },
        refs
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).not.toHaveProperty('id');
        expect(result.data).not.toHaveProperty('userId');
        expect(result.data).not.toHaveProperty('contaId');
        expect(result.data).not.toHaveProperty('cartaoId');
      }
    });

    it('deve manter cartão apenas para cartão de crédito e conta nos demais casos', () => {
      const cartao = normalizeTransactionProposal(
        { descricao: 'x', valor: 5, tipo: 'despesa', categoria: 'Alimentação', formaPagamento: 'Cartão de crédito', cartaoId: 'k1', contaId: 'c1' },
        refs
      );
      const conta = normalizeTransactionProposal(
        { descricao: 'x', valor: 5, tipo: 'despesa', categoria: 'Alimentação', formaPagamento: 'PIX', cartaoId: 'k1', contaId: 'c1' },
        refs
      );
      expect(cartao.ok && cartao.data.cartaoId).toBe('k1');
      expect(cartao.ok && cartao.data.contaId).toBeUndefined();
      expect(conta.ok && conta.data.contaId).toBe('c1');
      expect(conta.ok && conta.data.cartaoId).toBeUndefined();
    });

    it('deve rejeitar propostas sem descrição, valor inválido ou tipo inválido', () => {
      const base = { descricao: 'x', valor: 5, tipo: 'despesa', categoria: 'Alimentação' };
      expect(normalizeTransactionProposal({ ...base, descricao: ' ' }, refs).ok).toBe(false);
      expect(normalizeTransactionProposal({ ...base, valor: 0 }, refs).ok).toBe(false);
      expect(normalizeTransactionProposal({ ...base, valor: 'abc' }, refs).ok).toBe(false);
      expect(normalizeTransactionProposal({ ...base, tipo: 'transferencia' }, refs).ok).toBe(false);
    });
  });

  describe('getLocalDateString', () => {
    it('deve usar a data local e não UTC', () => {
      expect(getLocalDateString(new Date(2026, 10, 30, 23, 30))).toBe('2026-11-30');
    });
  });

  describe('resolveModel', () => {
    it('deve retornar o modelo escolhido quando definido', () => {
      expect(resolveModel({ aiProvider: 'openai', aiModel: 'gpt-4o-mini' })).toBe('gpt-4o-mini');
    });

    it('deve retornar o padrão do provedor quando não houver modelo', () => {
      expect(resolveModel({ aiProvider: 'openai' })).toBe('gpt-4o');
      expect(resolveModel({ aiProvider: 'gemini', aiModel: '  ' })).toBe('gemini-2.0-flash');
      expect(resolveModel({})).toBe('gpt-4o');
    });
  });

  describe('filtros de modelos', () => {
    it('deve manter apenas modelos de chat da OpenAI', () => {
      const result = filterOpenAIChatModels([
        'gpt-4o',
        'gpt-4o-mini',
        'text-embedding-3-small',
        'whisper-1',
        'tts-1',
        'dall-e-3',
        'omni-moderation-latest',
        'gpt-4o-audio-preview',
        'gpt-image-1',
        'gpt-3.5-turbo-instruct',
        'o1-mini',
      ]);
      expect(result.map((m) => m.id)).toEqual(['gpt-4o', 'gpt-4o-mini']);
    });

    it('deve manter apenas modelos do Gemini com generateContent', () => {
      const result = filterGeminiChatModels([
        { name: 'models/gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/text-embedding-004', supportedGenerationMethods: ['embedContent'] },
        { name: 'models/embedding-gecko', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/aqa', supportedGenerationMethods: ['generateAnswer'] },
        { name: 'models/gemini-1.5-flash' },
      ]);
      expect(result).toEqual([
        { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (gemini-2.0-flash)' },
      ]);
    });
  });

  describe('listAvailableModels', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('deve falhar sem consultar o provedor quando a chave estiver vazia', async () => {
      const fetchMock = vi.fn();
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      const result = await listAvailableModels({ aiApiKey: ' ', aiProvider: 'openai' });
      expect(result.success).toBe(false);
      expect(result.models).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('deve listar modelos compatíveis da OpenAI', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ id: 'gpt-4o' }, { id: 'whisper-1' }] }),
      }) as unknown as typeof fetch;

      const result = await listAvailableModels({ aiApiKey: 'k', aiProvider: 'openai' });
      expect(result.success).toBe(true);
      expect(result.models.map((m) => m.id)).toEqual(['gpt-4o']);
    });

    it('deve enviar a chave do Gemini no cabeçalho e não na URL', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          models: [{ name: 'models/gemini-2.0-flash', supportedGenerationMethods: ['generateContent'] }],
        }),
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      const result = await listAvailableModels({ aiApiKey: 'segredo', aiProvider: 'gemini' });
      expect(result.models.map((m) => m.id)).toEqual(['gemini-2.0-flash']);
      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).not.toContain('segredo');
      expect(init.headers['x-goog-api-key']).toBe('segredo');
    });

    it('deve informar quando nenhum modelo for compatível', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ id: 'whisper-1' }] }),
      }) as unknown as typeof fetch;

      const result = await listAvailableModels({ aiApiKey: 'k', aiProvider: 'openai' });
      expect(result.success).toBe(true);
      expect(result.models).toEqual([]);
      expect(result.message).toBe('Nenhum modelo compatível encontrado para esta chave.');
    });

    it('deve tratar chave inválida sem expor a chave na mensagem', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Incorrect API key provided' } }),
      }) as unknown as typeof fetch;

      const result = await listAvailableModels({ aiApiKey: 'segredo', aiProvider: 'openai' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('Chave de API inválida');
      expect(result.message).not.toContain('segredo');
    });

    it('deve tratar falha de rede', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) as unknown as typeof fetch;

      const result = await listAvailableModels({ aiApiKey: 'k', aiProvider: 'gemini' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('Falha de conexão');
    });
  });
});

