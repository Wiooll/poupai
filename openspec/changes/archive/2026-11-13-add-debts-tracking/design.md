## Context

O app é local-first (Dexie/IndexedDB), com estado exposto por `FinanceContext` via `useLiveQuery`. `Loan` guarda empréstimos simples. O pagamento de fatura (`pagarFatura`) já segue o padrão desejado: atualiza um status e cria uma `Transaction` de despesa ligada a uma conta. O backup (`FinanceBackupData`) é validado em `isValidBackupSnapshot`, que exige arrays estritos para as coleções atuais.

## Goals / Non-Goals

**Goals:**
- Registrar dívidas com histórico de abatimentos.
- Pagar (total ou parcial) gerando despesa e descontando da conta.
- Mostrar "Total devido" no Dashboard.
- Manter compatibilidade com dados e backups existentes.

**Non-Goals:**
- Alertas de vencimento.
- Cálculo automático de juros ou parcelas (campos apenas informativos).
- Dívidas de cartão de crédito (já tratadas por faturas) e empréstimos (`Loan`).

## Decisions

- **Entidade nova `Debt`, separada de `Loan`.** Semânticas diferentes ("devo ao banco" vs "emprestei ao João"). Evita inchar `Loan` e mexer em telas e testes existentes.
- **`DebtPayment` como tabela própria.** Campos: `id`, `debtId`, `valor`, `data`, `contaId`, `transactionId`, `createdAt`. O histórico fica consultável e o vínculo com a `Transaction` permite desfazer.
- **Saldo restante calculado, não gravado.** `restante = valorTotal - soma(pagamentos)`, em `src/utils/debtCalculations.ts`, como o total da fatura. Evita divergência entre valor gravado e histórico.
- **Status persistido: `pendente | parcial | quitada`.** Recalculado a cada pagamento ou exclusão de pagamento. "Vencida" é derivado (`vencimento < hoje` e não quitada), apenas para exibição.
- **Pagamento atômico.** Criar `Transaction`, criar `DebtPayment` e atualizar o status da dívida em uma única `db.transaction('rw', ...)`, para não deixar estado parcial em caso de falha.
- **Categoria fixa "Pagamento de Dívida".** Mesmo padrão de "Fatura de Cartão". Forma de pagamento `PIX` por padrão, como na fatura. Se a categoria não existir, é criada, seguindo o comportamento já usado para a fatura (verificar `addTransaction` na implementação).
- **Exclusão de pagamento remove a `Transaction` ligada**, para manter o saldo da conta coerente, e recalcula o status da dívida. Excluir a dívida remove seus pagamentos e as despesas ligadas, com confirmação na interface.
- **Pagamento órfão.** Se a `Transaction` for excluída pela tela de Transações, o `DebtPayment` permanece sem despesa. Decisão: o cálculo do saldo continua considerando o `DebtPayment`, e `transactionId` apontando para uma transação inexistente é tolerado. Alternativa mais rígida (bloquear exclusão) foi descartada por exigir mudança em `TransactionsTable`.
- **Validação de pagamento.** `0 < valor <= restante`, conta obrigatória, data válida. Validação em `src/utils/debtValidation.ts`, no padrão de `loanValidation.ts`.
- **Dexie `version(2)`.** Adiciona `debts: 'id, status'` e `debtPayments: 'id, debtId'`. Tabelas existentes permanecem na `version(1)` sem alteração, então não há migração de dados.
- **Backup compatível.** `FinanceBackupData` ganha `debts` e `debtPayments`. Em `isValidBackupSnapshot`, esses campos não são exigidos (podem faltar em backups antigos) e, se presentes, devem ser arrays. Na restauração e na exportação, `undefined` vira `[]`. `backupConflict.ts` considera as novas coleções ao decidir se os dados locais estão vazios.
- **Interface.** Nova aba `debts` ("Dívidas") em `App.tsx`, `Layout` e `MobileBottomNav`, seguindo o padrão de `Loans.tsx` (lista, formulário, erro inline em pt-BR). Total devido no Dashboard como card simples.
- **Versão.** Mudança visível: `APP_VERSION` e `package.json` passam para a próxima minor (4.12.0), com entrada em `releases.ts` e `CHANGELOG.md`.

## Risks / Trade-offs

- [Backup antigo rejeitado ou restauração apagando dívidas] → Campos opcionais na validação e `[]` como padrão; teste com backup sem `debts`.
- [Backup novo aberto em versão antiga do app] → Versões antigas ignoram campos extras; as dívidas só não aparecem. Aceito.
- [Pagamento órfão após excluir Transaction manualmente] → Tolerado e documentado; o histórico de abatimentos continua íntegro.
- [Falha no meio do pagamento] → Escrita em uma única transação do Dexie.
- [Arredondamento de centavos] → Comparar saldo restante com tolerância de centavos e arredondar valores a 2 casas ao quitar.
- [Aba extra no menu mobile] → Verificar espaço em `MobileBottomNav` e, se necessário, agrupar a aba em "Mais" conforme o padrão atual.
