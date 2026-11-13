## Contexto (estado real do código)

- Persistência: Dexie (`src/services/db.ts`, banco `FinDashDB`), lida por `useLiveQuery` no `FinanceContext`.
- Autenticação: `AuthContext` com usuário local fixo; não há login Google nem Firebase.
- Backup: `getBackupSnapshot()` / `restoreBackupSnapshot()` no `FinanceContext`, validação em `src/utils/localPersistence.ts` (`isValidBackupSnapshot`), UI manual em `Management.tsx`.
- Tipos: `FinanceBackupSnapshot { version, exportedAt, app, data }`.

## Objetivos de design

1. Manter o app 100% local por padrão; Drive é opt-in.
2. Reaproveitar o snapshot e a validação existentes, sem novo schema.
3. Falha de sync nunca bloqueia o uso local.
4. Mudança pequena, isolada em um serviço e um hook, reversível por flag.

## Arquitetura alvo

### Serviço `src/services/driveBackupService.ts`
- Obtém token via Google Identity Services (`google.accounts.oauth2.initTokenClient`), escopo `https://www.googleapis.com/auth/drive.appdata`.
- Token apenas em memória.
- Funções: localizar/criar `findash-backup.json` em `appDataFolder`, `uploadSnapshot`, `downloadSnapshot`.
- Resposta remota sempre validada com `isValidBackupSnapshot` antes de uso.

### Utilitário `src/utils/backupConflict.ts`
- `resolveConflict(local, remote)` retorna `'local' | 'remote'` comparando `exportedAt`; empate ou data inválida em um lado favorece o lado válido/local.

### Rastreador `src/services/localChangeTracker.ts`
- O `exportedAt` gerado por `getBackupSnapshot()` é sempre "agora", então não serve para comparar versões.
- Hooks do Dexie (`creating`, `updating`, `deleting`) gravam a data da última alteração local (`findash_local_updated_at`) e avisam assinantes.
- O upload usa essa data como `exportedAt`, e a restauração a ajusta para o `exportedAt` remoto.

### Provider `src/context/DriveSyncContext.tsx`
- Estados: `desconectado | sincronizado | pendente | sincronizando | erro`, mais última sincronização.
- Agenda upload com debounce de 5 s e até 2 retries (2 s e 4 s) somente em erros repetíveis.
- Na conexão aplica `resolveConflict`; sem restauração automática e com Drive mais recente, pausa os envios até o usuário restaurar ou forçar o envio.
- Regras extras de `resolveConflict`: dispositivo sem dados aceita o remoto; local com dados e sem data conhecida é preservado.

### UI
- Card "Backup automático no Google Drive" em `Management.tsx`: conectar/desconectar, switch de restauração automática, status e última sincronização.
- Preferências (`driveSyncEnabled`, `autoRestore`) em `localStorage`, sem dados sensíveis.

## Decisões

1. **Escopo `drive.appdata`**: o app só enxerga o próprio arquivo, sem acesso ao Drive do usuário.
2. **Sem Firebase**: Google Identity Services direto, sem SDK extra instalado (script carregado sob demanda).
3. **Conflito por `exportedAt`**: simples e previsível; sem merge por entidade.
4. **Feature flag**: sem `VITE_GOOGLE_CLIENT_ID`, a UI exibe que o recurso está indisponível e nada é carregado.

## Riscos e mitigações

1. Token expira (~1 h): reautorizar de forma silenciosa e, se falhar, mostrar estado de erro com botão "Reconectar".
2. Sobrescrever dados locais por engano: restauração automática é opt-in e só ocorre se o remoto for mais recente.
3. Regressão no CRUD: nenhuma alteração em `FinanceContext` além de expor um sinal de mudança (ou reutilizar `getBackupSnapshot`).

## Plano de rollback

Desligar `VITE_DRIVE_SYNC_ENABLED` (ou remover o Client ID). O app volta ao backup manual atual sem migração de dados.

## Fora de escopo

- Merge inteligente por entidade, histórico de versões, sincronização em tempo real multi-dispositivo.
- Reintroduzir login/contas de usuário no app.
