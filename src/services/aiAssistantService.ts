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
  gemini: 'gemini-3.8-flash',
} as const;

const PROVIDER_ENDPOINTS = {
  openai: 'https://api.openai.com/v1/chat/completions',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
} as const;

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
  const model = PROVIDER_MODELS[provider];
  const endpoint = PROVIDER_ENDPOINTS[provider];

  try {
    let responseText: string;

    if (provider === 'openai') {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.aiApiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      responseText = result.choices?.[0]?.message?.content || '{}';
    } else {
      // Gemini
      const response = await fetch(`${endpoint}?key=${config.aiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userMessage }] },
          ],
          generationConfig: {
            temperature: 0.1,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    }

    // Parse the JSON response
    let parsed: AIResponse;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // If parsing fails, treat as a text query response
      return {
        type: 'QUERY_RESPONSE',
        replyText: responseText,
      };
    }

    // Validate the response structure
    if (parsed.type === 'ACTION_PROPOSAL' && parsed.action && parsed.data && parsed.replyText) {
      return parsed;
    }

    if (parsed.type === 'QUERY_RESPONSE' && parsed.replyText) {
      return parsed;
    }

    // Fallback
    return {
      type: 'QUERY_RESPONSE',
      replyText: responseText,
    };
  } catch (error) {
    console.error('AI Service Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return {
      type: 'QUERY_RESPONSE',
      replyText: `❌ Erro ao processar com a IA: ${errorMessage}. Verifique sua chave de API e conexão.`,
    };
  }
}