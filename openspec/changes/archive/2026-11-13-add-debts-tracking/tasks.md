## 1. Modelo de dados e persistência

- [x] 1.1 Adicionar `DebtStatus`, `Debt` e `DebtPayment` em `src/types.ts` e incluir `debts` e `debtPayments` (opcionais) em `FinanceBackupData`
- [x] 1.2 Criar `version(2)` em `src/services/db.ts` com as tabelas `debts` e `debtPayments`, sem alterar a `version(1)`
- [x] 1.3 Ajustar `localPersistence.ts` (validação tolerante a campos ausentes) e `backupConflict.ts` (considerar as novas coleções)

## 2. Regras de negócio

- [x] 2.1 Criar `src/utils/debtCalculations.ts` (saldo restante, status, vencida, total devido) com arredondamento a 2 casas
- [x] 2.2 Criar `src/utils/debtValidation.ts` (dívida e pagamento) com mensagens em pt-BR
- [x] 2.3 Implementar em `FinanceContext.tsx`: `addDebt`, `updateDebt`, `deleteDebt`, `payDebt` e `deletePayment`, usando uma única transação do Dexie
- [x] 2.4 Incluir `debts` e `debtPayments` na exportação e na restauração de backup, com `[]` como padrão

## 3. Interface

- [x] 3.1 Criar `src/components/Debts.tsx` (lista, total em aberto, formulário, ação "Pagar", histórico e desfazer pagamento)
- [x] 3.2 Registrar a aba "Dívidas" em `App.tsx`, `Layout.tsx` e `MobileBottomNav.tsx`
- [x] 3.3 Adicionar o card "Total devido" ao `Dashboard.tsx`

## 4. Testes

- [x] 4.1 Testes de `debtCalculations` e `debtValidation`
- [x] 4.2 Testes de backup: snapshot sem `debts`/`debtPayments` continua válido; snapshot novo inclui as coleções
- [x] 4.3 Ajustar testes existentes afetados (`backupConflict`, `localPersistence`, `driveBackupService`)

## 5. Versão e documentação

- [x] 5.1 Atualizar `APP_VERSION` e `package.json` para 4.12.0 e adicionar entrada em `src/constants/releases.ts`
- [x] 5.2 Atualizar `README.md` e `CHANGELOG.md`
- [x] 5.3 Revisar ortografia pt-BR dos textos da interface
- [x] 5.4 Rodar `npm run lint`, testes e `npm run build`
- [x] 5.5 Gerar resumo das alterações para a descrição do commit em pt-BR
