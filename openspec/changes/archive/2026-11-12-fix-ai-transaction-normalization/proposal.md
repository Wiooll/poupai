## Why

Lançamentos criados pelo assistente de IA são confirmados com sucesso, mas não aparecem na aba Transações. O app grava os dados exatamente como a IA devolveu, sem validação. Data fora do formato `YYYY-MM-DD`, `tipo` com maiúscula, `valor` em texto, forma de pagamento fora da lista, categoria com grafia diferente ou conta/cartão inexistente fazem o registro ficar fora dos filtros e dos cálculos. Além disso, a data "hoje" do prompt usa UTC e pode mudar de dia ou mês à noite no Brasil, e o exemplo de JSON do prompt contém erro de sintaxe.

## What Changes

- Normalizar e validar a proposta da IA antes de exibir e salvar (data, tipo, valor, forma de pagamento, categoria, conta e cartão).
- Rejeitar propostas inválidas (sem descrição, valor inválido ou menor ou igual a zero) com mensagem clara em pt-BR.
- Usar a data local (não UTC) como "hoje" no prompt e como valor padrão.
- Corrigir o exemplo de JSON do prompt.
- Impedir que campos como `id` e `userId` vindos da IA sejam gravados em novo lançamento.
- Atualizar README, CHANGELOG e versão (4.9.1).

## Capabilities

### New Capabilities
- `ai-transaction-normalization`: validação e normalização dos lançamentos propostos pela IA antes de salvar, garantindo que apareçam em Transações.

### Modified Capabilities

## Impact

- `src/services/aiAssistantService.ts`: função `normalizeTransactionProposal`, uso em `processAIMessage`, data local e correção do prompt.
- `src/components/AiChatWidget.tsx`: usa os dados já normalizados.
- Testes em `aiAssistantService.test.ts`.
- Documentação e versão. Sem novas dependências.
