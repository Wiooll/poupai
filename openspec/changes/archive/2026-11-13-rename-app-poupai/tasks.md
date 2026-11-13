## 1. Constantes e versão

- [x] 1.1 Alterar `APP_NAME` para `PoupAi` e incrementar `APP_VERSION` (minor) em `src/constants/app.ts`, com comentário explicando que o prefixo `findash` interno é mantido de propósito
- [x] 1.2 Atualizar `version` em `package.json` (e `name` para `poupai`) mantendo a mesma versão de `APP_VERSION`
- [x] 1.3 Adicionar nova entrada em `src/constants/releases.ts` e ajustar o texto "Apoie o FinDash" da entrada histórica somente se necessário (histórico permanece)

## 2. Interface

- [x] 2.1 Atualizar `<title>` em `index.html`
- [x] 2.2 Atualizar textos em `AiChatWidget.tsx`, `AuthGate.tsx`, `Updates.tsx` usando `APP_NAME`
- [x] 2.3 Atualizar `Management.tsx`: seção "Apoie o PoupAi", termos, privacidade, assunto/corpo dos e-mails e nome do arquivo de backup (`poupai-backup-...`)

## 3. Conteúdo gerado

- [x] 3.1 Atualizar prompt do assistente em `aiAssistantService.ts`
- [x] 3.2 Atualizar relatório em `transactionImportExport.ts` e nome de arquivo em `TransactionsTable.tsx` (`poupai_...`)
- [x] 3.3 Atualizar campo `app` para `PoupAi` em `localPersistence.ts` e `FinanceContext.tsx`

## 4. Testes e documentação

- [x] 4.1 Atualizar `driveBackupService.test.ts` e `uiPreferences.test.ts` para o novo nome, mantendo um caso de backup antigo com `app: 'FinDash'` válido
- [x] 4.2 Atualizar `README.md` (título, descrição, versão e nota sobre identificadores internos) e `CHANGELOG.md`
- [x] 4.3 Busca final por `FinDash` em `src/`, `index.html` e `README.md`: só devem restar identificadores internos
- [x] 4.4 Rodar `npm run lint`, testes e `npm run build`
- [x] 4.5 Gerar resumo das alterações para a descrição do commit em pt-BR
