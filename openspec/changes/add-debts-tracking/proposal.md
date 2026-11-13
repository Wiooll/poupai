## Why

Hoje o app não tem onde registrar dívidas que o usuário precisa pagar, mas não consegue pagar no momento. A área "Empréstimos" (`Loan`) serve para dinheiro emprestado/recebido e não tem vencimento, credor, histórico de pagamentos nem ligação com contas. Sem um controle próprio, o usuário perde de vista quanto deve e paga as dívidas fora do fluxo de caixa.

## What Changes

- Nova entidade `Debt` (dívida), separada de `Loan`, com: descrição, credor, valor total, vencimento (opcional), prioridade (opcional), observação (opcional), juros e parcelas (apenas informativos) e status.
- Nova entidade `DebtPayment` (histórico de abatimentos), ligada à dívida e à `Transaction` de despesa gerada.
- Nova aba "Dívidas" com lista, total em aberto, cadastro, edição, exclusão e ação "Pagar" (total ou parcial).
- Ao pagar, o app cria uma `Transaction` de despesa (categoria fixa "Pagamento de Dívida") descontando da conta escolhida, e registra o `DebtPayment` correspondente.
- Estados persistidos: `pendente`, `parcial`, `quitada`. "Vencida" é calculado pela data de vencimento, sem ser gravado.
- Dashboard passa a exibir o card "Total devido" (soma dos saldos restantes das dívidas não quitadas).
- Backup (local e Drive) passa a incluir `debts` e `debtPayments`. Backups antigos sem esses campos continuam válidos.
- Nova versão do Dexie (`version(2)`) com as tabelas `debts` e `debtPayments`, sem alterar as existentes.
- Incremento de versão do app (minor), `README.md`, `CHANGELOG.md` e `releases.ts`.
- Fora do escopo: alertas de vencimento, cálculo automático de juros/parcelas, dívidas de cartão de crédito e empréstimos (`Loan`).

## Capabilities

### New Capabilities
- `debt-tracking`: cadastro de dívidas, histórico de abatimentos, pagamento com geração de despesa, cálculo do saldo restante e exibição do total devido no Dashboard.

### Modified Capabilities
<!-- Nenhuma. A inclusão de debts/debtPayments no backup é tratada dentro de debt-tracking, de forma compatível com backups antigos. -->

## Impact

- Código: `src/types.ts`, `src/services/db.ts`, `src/context/FinanceContext.tsx`, `src/utils/localPersistence.ts`, `src/utils/backupConflict.ts`, `src/App.tsx`, `src/components/{Layout,MobileBottomNav,Dashboard}.tsx`, novo `src/components/Debts.tsx`, novo `src/utils/debtCalculations.ts` e `src/utils/debtValidation.ts`, `src/constants/{app,releases}.ts`.
- Testes: novos testes de cálculo/validação e ajuste dos testes de backup existentes.
- Documentação: `README.md`, `CHANGELOG.md`, `package.json` (versão).
- Sem novas dependências. Migração de banco apenas aditiva (novas tabelas).
