import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractJsonFromText,
  formatAIErrorMessage,
  testAIConnection,
  GEMINI_FALLBACK_MODELS,
} from './aiAssistantService';

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
  });
});

