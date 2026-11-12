## 1. Serviço

- [x] 1.1 Criar `getLocalDateString` e usá-lo no prompt e como padrão.
- [x] 1.2 Criar `normalizeTransactionProposal` com as regras do design.
- [x] 1.3 Aplicar a normalização a `ADD_TRANSACTION` em `processAIMessage`, retornando aviso quando inválida.
- [x] 1.4 Corrigir o exemplo de JSON do prompt (`contaId` e `cartaoId`).

## 2. Interface

- [x] 2.1 Garantir que o `AiChatWidget` use os dados normalizados e não envie `id` em novo lançamento.

## 3. Testes e validação

- [x] 3.1 Testar a normalização (tipo, forma de pagamento, valor, data, categoria, conta/cartão, campos indevidos, rejeições).
- [x] 3.2 Rodar testes, lint e tsc.

## 4. Documentação e versão

- [x] 4.1 Atualizar README, CHANGELOG, releases e versão 4.9.1.
