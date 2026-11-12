## Context

`processAIMessage` devolve o JSON da IA após checar apenas o formato geral. `AiChatWidget.handleConfirmAction` repassa `data` direto para `addTransaction`. A tabela filtra por mês (`t.data.startsWith(filterMes)`) e por `tipo` exato, e os saldos usam `tipo`, `contaId` e `cartaoId`.

## Goals / Non-Goals

**Goals:**
- Todo lançamento salvo pela IA tem campos válidos e consistentes com o modelo `Transaction`.
- O usuário vê no preview os mesmos dados que serão salvos.

**Non-Goals:**
- Mudar o filtro de mês da tabela.
- Parcelamento e transferências via IA.
- Alterar UPDATE/DELETE além de impedir `userId` indevido.

## Decisions

- **Função pura `normalizeTransactionProposal(data, { categories, accounts, cards, today })`** no serviço, retornando `{ ok: true, data }` ou `{ ok: false, message }`. Alternativa descartada: validar só no widget, pois dificulta testes e o preview mostraria dados não normalizados.
- **Regras**: `descricao` obrigatória (trim); `valor` aceita número ou texto com vírgula ("12,50"), deve ser maior que zero; `tipo` em minúsculas, restrito a `receita`/`despesa` (`transferencia` rejeitada); `formaPagamento` mapeada sem acento/caixa para a lista oficial, padrão `PIX`; `data` precisa ser `YYYY-MM-DD` válida, senão usa hoje local; `categoria` casada sem caixa/acento com as existentes, senão mantém o texto informado; `contaId` e `cartaoId` só se existirem; `cartaoId` apenas com "Cartão de crédito".
- **Campos permitidos (lista branca)** para novo lançamento; `id`, `userId` e demais são descartados.
- **Data local**: helper `getLocalDateString(date)` com `getFullYear/getMonth/getDate`, usado no prompt e como padrão.
- **Aplicação**: normalizar em `processAIMessage` para `ADD_TRANSACTION`. Se inválida, retorna `QUERY_RESPONSE` com aviso. Assim o preview e o salvamento usam os mesmos dados.

## Risks / Trade-offs

- [Categoria inexistente continua sendo salva com o texto da IA] → Mantém o comportamento atual; casa com as existentes quando possível.
- [Rejeitar propostas parcialmente válidas] → Mensagem pede ao usuário mais detalhes.
