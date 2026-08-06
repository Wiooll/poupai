## 1. Setup and Dependencies

- [x] 1.1 Remove Firebase dependency (`npm uninstall firebase`) and delete `src/services/firebase.ts`.
- [x] 1.2 Install Dexie dependencies (`npm install dexie dexie-react-hooks`).
- [x] 1.3 Remove Firebase Auth logic from `AuthContext.tsx` (if any remains).

## 2. Local Database Schema Definition

- [x] 2.1 Create `src/services/db.ts` to initialize Dexie and declare stores (tables) for `transactions`, `categories`, `contas`, `cartoesCredito`, `faturaStatuses`, `recurringTransactions`, `categoryBudgets`, `loans`, `goals`, and `config`.

## 3. Refactoring FinanceContext (Reads & Writes)

- [x] 3.1 Refatorar a inicialização no `FinanceContext.tsx`, removendo dependências de `userId` e o uso de `onSnapshot` do Firestore.
- [x] 3.2 Implementar leituras reativas utilizando `useLiveQuery` do `dexie-react-hooks` para mapear os dados das tabelas para o state.
- [x] 3.3 Atualizar todas as funções de mutação (ex: `addTransaction`, `updateTransaction`, `deleteTransaction`, `addConta`, etc.) para utilizar as funções CRUD do Dexie (ex: `db.transactions.add`, `db.transactions.put`, `db.transactions.delete`).

## 4. Backup & Restore (Snapshots)

- [x] 4.1 Atualizar `src/utils/localPersistence.ts` para integrar com o novo Dexie DB.
- [x] 4.2 Implementar `buildCurrentBackupData` para extrair todos os registros do Dexie.
- [x] 4.3 Implementar `restoreBackupSnapshot` para limpar o Dexie e inserir os registros vindos de um snapshot JSON.

## 5. Verification

- [x] 5.1 Testar offline: Criar despesas e verificar a atualização na tela em tempo real.
- [x] 5.2 Testar persistência: Recarregar a página e garantir que os dados persistem.
- [x] 5.3 Testar exportação/importação: Exportar um snapshot JSON, limpar o cache e reimportá-lo.
