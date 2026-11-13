## Why

O aplicativo hoje se chama **FinDash**. A marca será alterada para **PoupAi**, e o nome precisa ser consistente em tudo o que o usuário vê (interface, títulos, exportações, e-mails de feedback) e na documentação.

## What Changes

- Trocar o nome exibido de "FinDash" para "PoupAi" na interface: `APP_NAME`, título da página (`index.html`), assistente de IA, textos da tela de entrada, termos e privacidade, seção "Apoie o PoupAi", tela de atualizações e rodapé de copyright.
- Atualizar textos gerados: assunto e corpo dos e-mails (`[PoupAi] Sugestão` / `[PoupAi] Bug`), relatório de impressão/exportação, nome dos arquivos exportados (`poupai_...`, `poupai-backup-...`) e prompt do assistente de IA.
- Atualizar o campo `app` dos novos backups para `PoupAi`. A validação já aceita qualquer string, então backups antigos (`FinDash`) continuam válidos.
- Atualizar `package.json` (`name`), `README.md`, `CHANGELOG.md` e a versão do app (incremento de versão, com nova entrada em `releases.ts`).
- **Não alterar** identificadores internos que guardam dados do usuário: banco Dexie `FinDashDB`, chaves de `localStorage` (`findash_*`, `findash:*`) e o arquivo `findash-backup.json` no Google Drive. Renomear esses itens faria o usuário perder dados ou o backup existente.
- Registros históricos (changelog antigo, changes arquivadas) permanecem como estão.

## Capabilities

### New Capabilities
- `app-branding`: define o nome oficial do aplicativo (PoupAi), sua centralização em uma constante e os pontos de interface e exportação que devem usá-lo.

### Modified Capabilities
<!-- Nenhuma. Nenhum requisito de spec existente muda. -->

## Impact

- Código: `src/constants/app.ts`, `src/constants/releases.ts`, `index.html`, `package.json`, `src/components/{AiChatWidget,AuthGate,Management,Updates}.tsx`, `src/services/aiAssistantService.ts`, `src/utils/{transactionImportExport,localPersistence}.ts`, `src/components/TransactionsTable.tsx`, `src/context/FinanceContext.tsx`, `src/services/driveBackupService.test.ts`, `src/utils/uiPreferences.test.ts`.
- Documentação: `README.md`, `CHANGELOG.md`.
- Sem novas dependências e sem migração de dados.
- Pendência fora do repositório: o nome do repositório e o link `github.com/Wiooll/Findash` no CHANGELOG não são alterados aqui.
