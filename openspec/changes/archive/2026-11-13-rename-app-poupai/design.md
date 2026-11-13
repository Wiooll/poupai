## Context

O nome "FinDash" aparece em constantes, textos de interface, arquivos exportados, prompt da IA e documentação. Parte vem de `APP_NAME` (`src/constants/app.ts`), mas muitos textos têm o nome escrito direto no código. Além disso, o nome aparece em identificadores internos que guardam dados do usuário: banco Dexie `FinDashDB`, chaves de `localStorage` (`findash_*`, `findash:*`) e o arquivo `findash-backup.json` no `appDataFolder` do Google Drive.

## Goals / Non-Goals

**Goals:**
- Todo texto visível ao usuário e todo arquivo gerado passam a usar "PoupAi".
- Textos de interface passam a usar `APP_NAME` quando o componente já o importa ou quando for simples importá-lo.
- Nenhuma perda de dados nem quebra de backup existente.

**Non-Goals:**
- Renomear banco Dexie, chaves de `localStorage` ou o arquivo de backup no Drive.
- Alterar identidade visual (logo, cores, favicon).
- Reescrever histórico (CHANGELOG antigo, changes arquivadas) ou renomear o repositório.

## Decisions

- **Manter identificadores internos como `findash`.** Renomear `FinDashDB` criaria um banco vazio no Dexie, e renomear as chaves de `localStorage` apagaria preferências. Renomear `findash-backup.json` faria o app não achar o backup já salvo no Drive. Alternativa considerada: migração com cópia de dados. Foi descartada por custo e risco sem ganho para o usuário, já que esses nomes não são visíveis.
- **Centralizar em `APP_NAME`.** Textos de componentes e do relatório usam a constante, em vez de repetir a string. Para o prompt da IA e para nomes de arquivo, usa-se `APP_NAME` (com `toLowerCase()` nos nomes de arquivo).
- **Campo `app` do backup.** Novos backups gravam `PoupAi`. A validação em `isValidBackupSnapshot` só exige `string`, então backups com `FinDash` continuam sendo restaurados.
- **Nome de arquivo exportado.** O nome muda para `poupai-backup-AAAA-MM-DD.json` e `poupai_<modo>_<data>`. Não há leitura desses nomes por outras partes do código.
- **Versão.** Mudança visível ao usuário: incrementa-se `APP_VERSION` e `package.json` para a próxima versão minor, com nova entrada em `releases.ts` e no `CHANGELOG.md`, conforme a regra do projeto.
- **E-mail de suporte.** `SUPPORT_EMAIL` e `local@findash.app` (usuário local, não exibido como contato) permanecem sem alteração, pois dependem de domínio/caixa existentes.

## Risks / Trade-offs

- [Ocorrência esquecida de "FinDash" na interface] → Busca final por `FinDash` (sem diferenciar maiúsculas) em `src/`, `index.html`, `README.md`; só devem restar identificadores internos e histórico.
- [Inconsistência entre nome público e chaves internas] → Documentar no README/comentário de `app.ts` que o prefixo `findash` é mantido de propósito.
- [Testes que fixam o texto antigo] → Atualizar `driveBackupService.test.ts` e `uiPreferences.test.ts`, depois rodar a suíte.
- [Usuário com nome de arquivo antigo no Drive] → Nenhum impacto, pois o nome do arquivo remoto não muda.
