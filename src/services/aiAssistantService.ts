import type {
  Transaction,
  Categoria,
  Conta,
  CartaoCredito,
  AppConfig,
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
  userMessage: string
): Promise<{ text: string; modelUsed: string }> {
  let lastError: Error | null = null;

  for (const model of GEMINI_FALLBACK_MODELS) {
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
  config: Pick<AppConfig, 'aiApiKey' | 'aiProvider'>
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
          model: PROVIDER_MODELS.openai,
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro HTTP: ${response.status}`);
      }

      return {
        success: true,
        message: 'Conexão com a OpenAI (GPT-4o) validada com sucesso!',
        modelUsed: PROVIDER_MODELS.openai,
      };
    } else {
      const { modelUsed } = await callGeminiWithFallback(
        config.aiApiKey.trim(),
        'Você é um verificador de conectividade. Responda apenas com JSON: {"status":"ok"}.',
        'ping'
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

function buildSystemPrompt(context: AIContext): string {
  const categoriesList = context.categories
    .map((c) => `- ${c.nome} (${c.tipo})`)
    .join('\n');

  const accountsList = context.accounts
    .map((a) => `- ${a.nome} (${a.tipo})`)
    .join('\n') || 'Nenhuma conta cadastrada';

  const cardsList = context.cards
    .map((c) => `- ${c.nome} (limite: R$ ${c.limite.toFixed(2)})`)
    .join('\n') || 'Nenhum cartão cadastrado';

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return `Você é um assistente financeiro inteligente do aplicativo FinDash.
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
    "contaId?: string",
    "cartaoId?: string"
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
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
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
          model: PROVIDER_MODELS.openai,
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
        userMessage
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