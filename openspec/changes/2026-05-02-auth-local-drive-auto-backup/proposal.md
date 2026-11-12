## Por quê

A migração para offline-first (Sprint 4.8.0) já removeu o Firebase/Firestore: os dados vivem em Dexie (IndexedDB) e o `AuthContext` é um usuário local fixo (`local-user`). O backup hoje é apenas manual (exportar/importar JSON na aba Gerenciamento).

Falta reduzir o risco de perda de dados locais (limpeza do navegador, troca de dispositivo) com um backup automático opcional no Google Drive da própria conta do usuário, sem trazer de volta nenhum banco remoto.

## O que muda

- Limpar resquícios textuais de Firebase/Firestore (rodapé do `AuthGate`, mensagens de erro de login, comentário em `TransactionsTable`).
- Adicionar conexão **opcional** com o Google Drive via Google Identity Services (sem Firebase), usando somente o escopo `drive.appdata` (arquivo oculto do app).
- Adicionar sincronização automática do snapshot de backup existente (`FinanceBackupSnapshot`) com debounce, retry leve e status visível.
- Adicionar restauração automática opcional ao conectar, com regra "mais recente vence" (`exportedAt`); empate mantém o local.
- Tudo desativado por padrão e controlado por feature flag/config (`VITE_GOOGLE_CLIENT_ID` + `VITE_DRIVE_SYNC_ENABLED`).
- Atualizar README, CHANGELOG, versão e notas de release.

## Capacidades

### Novas
- `google-drive-automatic-backup`: backup/sincronização automática opcional do snapshot no Drive.

### Modificadas
- `local-user-data-persistence` (documenta o estado atual): persistência local em Dexie, offline-first.

### Descontinuadas
- `firebase-user-auth` e `firestore-user-data-isolation`: não se aplicam mais (já não existem no código).

## Impacto

- Dados: nenhuma mudança de schema no Dexie; reaproveita `getBackupSnapshot` e `restoreBackupSnapshot`.
- Integração: novo script do Google Identity Services carregado sob demanda, apenas quando o Drive está habilitado.
- Privacidade: sem Client ID configurado, o app continua 100% local e sem requisições externas.
- UX: card de status (sincronizado, pendente, erro, última sincronização) na aba Gerenciamento.
- Segurança: token de acesso mantido apenas em memória; nunca persistido nem logado.
