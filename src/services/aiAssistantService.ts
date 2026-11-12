import { APP_NAME } from '../constants/app';
import type {
  Transaction,
  Categoria,
  Conta,
  CartaoCredito,
  AppConfig,
  PaymentMethod,
} from '../types';

export interface AIContext {
  categories: Categoria[];
  accounts: Conta[];
  cards: CartaoCredito[];
  monthlySummary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
}

export interface AIActionProposal {
  type: 'ACTION_PROPOSAL';
  action: 'ADD_TRANSACTION' | 'UPDATE_TRANSACTION' | 'DELETE_TRANSACTION';
  data: Partial<Transaction> & { id?: string };
  replyText: string;
}

export interface AIQueryResponse {
  type: 'QUERY_RESPONSE';
  replyText: string;
}

export type AIResponse = AIActionProposal | AIQueryResponse;

interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const PROVIDER_MODELS = {
  openai: 'gpt-4o',
  gemini: 'gemini-2.0-flash',
} as const;

export const GEMINI_FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'] as const;

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODELS_ENDPOINT = 'https://api.openai.com/v1/models';
const GEMINI_MODELS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000';

export interface AIModelOption {
  id: string;
  label: string;
}

export interface AIModelListResult {
  success: boolean;
  models: AIModelOption[];
  message: string;
}

// Modelos de chat da OpenAI aceitos pelo assistente (usa temperature e response_format).
// A família "o*" foi deixada de fora por não aceitar o parâmetro temperature.
const OPENAI_CHAT_MODEL_PATTERN = /^(gpt-|chatgpt-)/i;
const OPENAI_EXCLUDED_TERMS = [
  'embedding',
  'whisper',
  'tts',
  'dall-e',
  'moderation',
  'audio',
  'realtime',
  'transcribe',
  'image',
  'instruct',
  'search',
];
const GEMINI_EXCLUDED_TERMS = ['embedding', 'aqa', 'imagen', 'veo', 'tts'];

export function filterOpenAIChatModels(ids: string[]): AIModelOption[] {
  return ids
    .filter((id) => OPENAI_CHAT_MODEL_PATTERN.test(id))
    .filter((id) => !OPENAI_EXCLUDED_TERMS.some((term) => id.toLowerCase().includes(term)))
    .sort((a, b) => a.localeCompare(b))
    .map((id) => ({ id, label: id }));
}

export function filterGeminiChatModels(
  models: Array<{ name?: string; displayName?: string; supportedGenerationMethods?: string[] }>
): AIModelOption[] {
  return models
    .filter((m) => typeof m.name === 'string' && m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => {
      const id = (m.name as string).replace(/^models\//, '');
      return { id, label: m.displayName ? `${m.displayName} (${id})` : id };
    })
    .filter((m) => !GEMINI_EXCLUDED_TERMS.some((term) => m.id.toLowerCase().includes(term)))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Retorna o modelo escolhido pelo usuário ou o padrão do provedor. */
export function resolveModel(config: Pick<AppConfig, 'aiProvider' | 'aiModel'>): string {
  const provider = config.aiProvider || 'openai';
  return config.aiModel?.trim() || PROVIDER_MODELS[provider];
}

export async function listAvailableModels(
  config: Pick<AppConfig, 'aiApiKey' | 'aiProvider'>
): Promise<AIModelListResult> {
  const apiKey = config.aiApiKey?.trim();
  if (!apiKey) {
    return {
      success: false,
      models: [],
      message: 'Por favor, informe a chave de API antes de carregar os modelos.',
    };
  }

  const provider = config.aiProvider || 'openai';

  try {
    const response =
      provider === 'openai'
        ? await fetch(OPENAI_MODELS_ENDPOINT, { headers: { Authorization: `Bearer ${apiKey}` } })
        : await fetch(GEMINI_MODELS_ENDPOINT, { headers: { 'x-goog-api-key': apiKey } });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    const models =
      provider === 'openai'
        ? filterOpenAIChatModels(
            (Array.isArray(data?.data) ? data.data : [])
              .map((m: { id?: unknown }) => m?.id)
              .filter((id: unknown): id is string => typeof id === 'string')
          )
        : filterGeminiChatModels(Array.isArray(data?.models) ? data.models : []);

    if (models.length === 0) {
      return {
        success: true,
        models: [],
        message: 'Nenhum modelo compatível encontrado para esta chave.',
      };
    }

    return {
      success: true,
      models,
      message: `${models.length} ${models.length === 1 ? 'modelo compatível encontrado' : 'modelos compatíveis encontrados'}.`,
    };
  } catch (err) {
    return { success: false, models: [], message: formatAIErrorMessage(err) };
  }
}

export function extractJsonFromText(rawText: string): unknown {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Conteúdo vazio recebido');
  }

  const trimmed = rawText.trim();

  // 1. Tentar parse direto
  try {
    return JSON.parse(trimmed);
  } catch {
    // Continua para extração especializada
  }

  // 2. Extrair de blocos de código Markdown (```json ... ``` ou ``` ... ```)
  const markdownCodeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (markdownCodeBlockMatch && markdownCodeBlockMatch[1]) {
    try {
      return JSON.parse(markdownCodeBlockMatch[1].trim());
    } catch {
      // Continua se falhar
    }
  }

  // 3. Localizar delimitadores de objeto JSON { ... }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // Ignora
    }
  }

  throw new Error('Não foi possível identificar um JSON válido na resposta.');
}

export function formatAIErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Erro inesperado na comunicação com o serviço de IA.';
  }

  const msg = error.message;

  const lowerMsg = msg.toLowerCase();

  if (
    msg.includes('400') ||
    msg.includes('API_KEY_INVALID') ||
    lowerMsg.includes('invalid api key') ||
    lowerMsg.includes('api key not valid') ||
    lowerMsg.includes('pass a valid api key') ||
    msg.includes('Incorrect API key')
  ) {
    return 'Chave de API inválida ou incorreta. Verifique a chave nas Configurações de IA na aba Gerenciamento.';
  }
  if (msg.includes('401')) {
    return 'Autenticação recusada pelo provedor de IA. Verifique sua chave de API.';
  }
  if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
    return 'Acesso não autorizado para esta chave de API. Verifique permissões ou restrições de faturamento/região no provedor.';
  }
  if (msg.includes('404') || msg.includes('is not found') || msg.includes('not supported')) {
    return 'O modelo de IA solicitado não está disponível para esta chave ou região.';
  }
  if (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('rate_limit_exceeded') ||
    msg.toLowerCase().includes('quota')
  ) {
    return 'Limite de requisições ou cota da chave de API atingido. Aguarde alguns instantes antes de tentar novamente.';
  }
  if (
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    lowerMsg.includes('high demand') ||
    lowerMsg.includes('overloaded')
  ) {
    return 'O modelo de IA está com alta demanda no momento. Tente novamente em instantes ou escolha outro modelo nas Configurações de IA.';
  }
  if (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('Network request failed')
  ) {
    return 'Falha de conexão com o provedor de IA. Verifique sua conexão com a internet ou restrições de rede/CORS.';
  }

  return `Erro ao processar com a IA: ${msg}`;
}

async function callGeminiWithFallback(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  chosenModel?: string
): Promise<{ text: string; modelUsed: string }> {
  let lastError: Error | null = null;

  // Com modelo escolhido pelo usuário não há fallback; sem ele, usa a lista padrão
  const modelsToTry: readonly string[] = chosenModel ? [chosenModel] : GEMINI_FALLBACK_MODELS;

  for (const model of modelsToTry) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userMessage }] },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error?.message || `Erro HTTP: ${response.status}`;
        if (response.status === 404) {
          lastError = new Error(`Erro HTTP: ${response.status} - ${message}`);
          continue;
        }
        throw new Error(message);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      return { text, modelUsed: model };
    } catch (err) {
      if (err instanceof Error && (err.message.includes('404') || err.message.includes('not found'))) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Nenhum modelo compatível do Gemini respondeu com sucesso.');
}

export interface AIConnectionTestResult {
  success: boolean;
  message: string;
  modelUsed?: string;
}

export async function testAIConnection(
  config: Pick<AppConfig, 'aiApiKey' | 'aiProvider' | 'aiModel'>
): Promise<AIConnectionTestResult> {
  if (!config.aiApiKey?.trim()) {
    return {
      success: false,
      message: 'Por favor, informe a chave de API antes de testar a conexão.',
    };
  }

  const provider = config.aiProvider || 'openai';

  try {
    if (provider === 'openai') {
      const response = await fetch(OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.aiApiKey.trim()}`,
        },
        body: JSON.stringify({
          model: resolveModel(config),
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro HTTP: ${response.status}`);
      }

      const openAIModel = resolveModel(config);
      return {
        success: true,
        message: `Conexão com a OpenAI (${openAIModel}) validada com sucesso!`,
        modelUsed: openAIModel,
      };
    } else {
      const { modelUsed } = await callGeminiWithFallback(
        config.aiApiKey.trim(),
        'Você é um verificador de conectividade. Responda apenas com JSON: {"status":"ok"}.',
        'ping',
        config.aiModel?.trim() || undefined
      );

      return {
        success: true,
        message: `Conexão com o Google Gemini validada com sucesso via ${modelUsed}!`,
        modelUsed,
      };
    }
  } catch (err) {
    return {
      success: false,
      message: formatAIErrorMessage(err),
    };
  }
}

/** Data local no formato YYYY-MM-DD (evita o deslocamento do UTC de toISOString). */
export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const PAYMENT_METHODS: PaymentMethod[] = ['Dinheiro', 'Cartão de crédito', 'Débito', 'PIX'];

const simplify = (value: unknown): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function parseAmount(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return NaN;
  const cleaned = value.replace(/[^\d,.-]/g, '');
  // "1.234,56" -> 1234.56 ; "12,50" -> 12.5 ; "12.50" -> 12.5
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  return Number(normalized);
}

export type NormalizedProposalResult =
  | { ok: true; data: Omit<Transaction, 'id'> }
  | { ok: false; message: string };

/**
 * Valida e normaliza um lançamento proposto pela IA para que seja salvo
 * com campos consistentes e apareça corretamente em Transações.
 */
export function normalizeTransactionProposal(
  raw: Record<string, unknown>,
  refs: { categories: Categoria[]; accounts: Conta[]; cards: CartaoCredito[]; today?: string }
): NormalizedProposalResult {
  const descricao = typeof raw.descricao === 'string' ? raw.descricao.trim() : '';
  if (!descricao) {
    return { ok: false, message: 'Não consegui identificar a descrição do lançamento. Pode informar do que se trata?' };
  }

  const valor = parseAmount(raw.valor);
  if (!Number.isFinite(valor) || valor <= 0) {
    return { ok: false, message: 'Não consegui identificar um valor válido para o lançamento. Pode informar o valor?' };
  }

  const tipoSimples = simplify(raw.tipo);
  if (tipoSimples !== 'receita' && tipoSimples !== 'despesa') {
    return { ok: false, message: 'Não consegui identificar se o lançamento é uma receita ou uma despesa. Pode informar?' };
  }

  const formaPagamento =
    PAYMENT_METHODS.find((p) => simplify(p) === simplify(raw.formaPagamento)) ?? 'PIX';

  const data = isValidIsoDate(raw.data) ? raw.data : refs.today ?? getLocalDateString();

  const categoriaInformada = typeof raw.categoria === 'string' ? raw.categoria.trim() : '';
  const categoriaExistente = refs.categories.find((c) => simplify(c.nome) === simplify(categoriaInformada));
  const categoria = categoriaExistente?.nome ?? categoriaInformada;
  if (!categoria) {
    return { ok: false, message: 'Não consegui identificar a categoria do lançamento. Pode informar?' };
  }

  const contaId =
    typeof raw.contaId === 'string' && refs.accounts.some((a) => a.id === raw.contaId) ? raw.contaId : undefined;
  const cartaoId =
    typeof raw.cartaoId === 'string' && refs.cards.some((c) => c.id === raw.cartaoId) ? raw.cartaoId : undefined;
  const isCartao = formaPagamento === 'Cartão de crédito';

  return {
    ok: true,
    data: {
      data,
      descricao,
      categoria,
      tipo: tipoSimples,
      valor,
      formaPagamento,
      ...(isCartao && cartaoId ? { cartaoId } : {}),
      ...(!isCartao && contaId ? { contaId } : {}),
    },
  };
}

function buildSystemPrompt(context: AIContext): string {
  const categoriesList = context.categories
    .map((c) => `- ${c.nome} (${c.tipo})`)
    .join('\n');

  const accountsList = context.accounts
    .map((a) => `- ${a.nome} (${a.tipo}) [id: ${a.id}]`)
    .join('\n') || 'Nenhuma conta cadastrada';

  const cardsList = context.cards
    .map((c) => `- ${c.nome} (limite: R$ ${c.limite.toFixed(2)}) [id: ${c.id}]`)
    .join('\n') || 'Nenhum cartão cadastrado';

  const today = getLocalDateString();
  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return `Você é um assistente financeiro inteligente do aplicativo ${APP_NAME}.
Hoje é ${today} (${currentMonth}).

## Contexto Financeiro do Usuário

### Categorias Disponíveis
${categoriesList}

### Contas / Carteiras
${accountsList}

### Cartões de Crédito
${cardsList}

### Resumo do Mês Atual
- Receitas: R$ ${context.monthlySummary.totalIncome.toFixed(2)}
- Despesas: R$ ${context.monthlySummary.totalExpense.toFixed(2)}
- Saldo: R$ ${context.monthlySummary.balance.toFixed(2)}

## Instruções

1. **SEMPRE** responda em **Português do Brasil**.
2. Para **lançamentos** (criar/editar/excluir transações):
   - Retorne APENAS um JSON válido no formato ACTION_PROPOSAL.
   - NÃO adicione texto explicativo antes ou depois do JSON.
   - O campo "data" deve estar no formato YYYY-MM-DD.
   - Use "hoje" como ${today} se o usuário não especificar.
   - Para "formaPagamento", use: "Dinheiro", "Cartão de crédito", "Débito" ou "PIX".
   - Para "tipo", use: "receita", "despesa" ou "transferencia".
   - Se não souber a categoria exata, escolha a mais próxima da lista.
   - Se não souber a conta/cartão, omita o campo.
3. Para **perguntas/consultas** (saldos, resumos, análises):
   - Responda normalmente em texto (tipo QUERY_RESPONSE).
   - Use os dados do contexto para calcular e responder.
4. Se a intenção não for clara, peça esclarecimento.
5. NUNCA invente dados que não estejam no contexto.

## Formato de Resposta para Ações (ACTION_PROPOSAL):
{
  "type": "ACTION_PROPOSAL",
  "action": "ADD_TRANSACTION",
  "data": {
    "descricao": "string",
    "valor": number,
    "categoria": "string",
    "tipo": "receita|despesa|transferencia",
    "formaPagamento": "string",
    "data": "YYYY-MM-DD",
    "contaId": "string (opcional, id da conta)",
    "cartaoId": "string (opcional, id do cartão)"
  },
  "replyText": "Texto amigável para exibir ao usuário antes da confirmação"
}

## Formato de Resposta para Consultas (QUERY_RESPONSE):
{
  "type": "QUERY_RESPONSE",
  "replyText": "Resposta completa em texto para o usuário"
}`;
}

function calculateMonthlySummary(transactions: Transaction[]): AIContext['monthlySummary'] {
  const currentMonth = getLocalDateString().slice(0, 7); // YYYY-MM
  let totalIncome = 0;
  let totalExpense = 0;

  for (const t of transactions) {
    if (t.data.startsWith(currentMonth)) {
      if (t.tipo === 'receita') {
        totalIncome += Number(t.valor);
      } else if (t.tipo === 'despesa') {
        totalExpense += Number(t.valor);
      }
    }
  }

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
}

export async function processAIMessage(
  userMessage: string,
  contextData: {
    transactions: Transaction[];
    categories: Categoria[];
    accounts: Conta[];
    cards: CartaoCredito[];
    config: AppConfig;
  }
): Promise<AIResponse> {
  const { config, ...data } = contextData;

  if (!config.aiApiKey) {
    return {
      type: 'QUERY_RESPONSE',
      replyText: '⚠️ Nenhuma chave de API configurada. Vá em **Gerenciamento > Configurações de IA** para adicionar sua chave.',
    };
  }

  const monthlySummary = calculateMonthlySummary(data.transactions);
  const aiContext: AIContext = {
    categories: data.categories,
    accounts: data.accounts,
    cards: data.cards,
    monthlySummary,
  };

  const systemPrompt = buildSystemPrompt(aiContext);

  const messages: AIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  const provider = config.aiProvider || 'openai';

  try {
    let responseText: string;

    if (provider === 'openai') {
      const response = await fetch(OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.aiApiKey}`,
        },
        body: JSON.stringify({
          model: resolveModel(config),
          messages,
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      responseText = result.choices?.[0]?.message?.content || '{}';
    } else {
      // Gemini com fallback automático de modelos
      const { text } = await callGeminiWithFallback(
        config.aiApiKey,
        systemPrompt,
        userMessage,
        config.aiModel?.trim() || undefined
      );
      responseText = text;
    }

    // Parse seguro da resposta JSON
    let parsed: unknown;
    try {
      parsed = extractJsonFromText(responseText);
    } catch {
      // Se não for possível extrair JSON, retorna o texto puro como resposta
      return {
        type: 'QUERY_RESPONSE',
        replyText: responseText.trim(),
      };
    }

    const obj = (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>;

    // Validate the response structure
    if (
      obj.type === 'ACTION_PROPOSAL' &&
      typeof obj.action === 'string' &&
      obj.data &&
      typeof obj.data === 'object' &&
      typeof obj.replyText === 'string'
    ) {
      if (obj.action === 'ADD_TRANSACTION') {
        const normalized = normalizeTransactionProposal(obj.data as Record<string, unknown>, {
          categories: data.categories,
          accounts: data.accounts,
          cards: data.cards,
        });
        if (!normalized.ok) {
          return { type: 'QUERY_RESPONSE', replyText: normalized.message };
        }
        return {
          type: 'ACTION_PROPOSAL',
          action: 'ADD_TRANSACTION',
          data: normalized.data,
          replyText: obj.replyText,
        };
      }
      return obj as unknown as AIActionProposal;
    }

    if (obj.type === 'QUERY_RESPONSE' && typeof obj.replyText === 'string') {
      return {
        type: 'QUERY_RESPONSE',
        replyText: obj.replyText,
      };
    }

    // Se tiver replyText genérico
    if (typeof obj.replyText === 'string') {
      return {
        type: 'QUERY_RESPONSE',
        replyText: obj.replyText,
      };
    }

    // Fallback
    return {
      type: 'QUERY_RESPONSE',
      replyText: responseText,
    };
  } catch (error) {
    console.error('AI Service Error:', error);
    const friendlyMessage = formatAIErrorMessage(error);
    return {
      type: 'QUERY_RESPONSE',
      replyText: `❌ ${friendlyMessage}`,
    };
  }
}