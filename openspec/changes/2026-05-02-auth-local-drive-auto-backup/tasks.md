## 1. Limpeza de resquícios Firebase/Firestore
- [x] 1.1 Ajustar rodapé e mensagens de erro de login em `AuthGate.tsx` (sem menção a Firebase).
- [x] 1.2 Reescrever comentário em `TransactionsTable.tsx` sem referência a Firestore.
- [x] 1.3 Conferir que não restam referências em `src/`, `.env.example` e arquivos de configuração.

## 2. Núcleo de conflito e serviço Drive
- [x] 2.1 Criar `src/utils/backupConflict.ts` com `resolveConflict` (mais recente vence; empate mantém local).
- [x] 2.2 Criar `src/services/driveBackupService.ts` (token em memória, localizar/criar, upload e download em `appDataFolder`).
- [x] 2.3 Adicionar `VITE_GOOGLE_CLIENT_ID` e `VITE_DRIVE_SYNC_ENABLED` ao `.env.example` (sem valores reais).

## 3. Sincronização automática
- [x] 3.1 Criar sincronização com debounce, retry leve e estados (`DriveSyncContext` + `localChangeTracker`).
- [x] 3.2 Implementar restauração automática opcional na conexão aplicando `resolveConflict`.
- [x] 3.3 Garantir que falhas de Drive não bloqueiem nem alterem dados locais.

## 4. Interface
- [x] 4.1 Adicionar card de Drive (`DriveSyncCard`) em `Management.tsx`.
- [x] 4.2 Atualizar textos do card "Backup Manual" para refletir Dexie (não localStorage).

## 5. Qualidade
- [x] 5.1 Testes unitários de `resolveConflict`.
- [x] 5.2 Testes do serviço Drive com `fetch` mockado (sucesso, 401, rede, 500, snapshot inválido).
- [ ] 5.3 Rodar `npm run lint`, `npm test` e `npm run build` (lint tem 2 erros preexistentes em `AiChatWidget.tsx`).
- [ ] 5.4 Validação manual com Client ID real (conectar, alterar, recarregar, reconectar, restaurar).

## 6. Documentação, versão e comunicação
- [x] 6.1 Atualizar `README.md` (arquitetura local + Drive opcional, variáveis de ambiente).
- [x] 6.2 Atualizar versão (`package.json`, `src/constants/app.ts`) e `src/constants/releases.ts`.
- [x] 6.3 Atualizar `CHANGELOG.md`.
