# google-drive-automatic-backup Specification

## Purpose
TBD - created by archiving change 2026-05-02-auth-local-drive-auto-backup. Update Purpose after archive.
## Requirements
### Requirement: Backup automático opcional no Google Drive
O sistema SHALL, quando o usuário conectar sua conta Google, sincronizar automaticamente o snapshot de backup para um arquivo oculto do app (`appDataFolder`) no Drive da própria conta.

#### Scenario: Sincronização após alteração de dados
- **WHEN** ocorrer alteração de dados financeiros com o Drive conectado
- **THEN** o sistema agenda upload do snapshot com debounce
- **AND** exibe o estado "pendente" até concluir e "sincronizado" com a data da última sincronização

#### Scenario: Recurso não configurado
- **WHEN** não houver Client ID configurado ou a flag estiver desativada
- **THEN** o sistema não carrega scripts externos nem faz requisições ao Google
- **AND** a interface informa que o recurso está indisponível

### Requirement: Mínimo privilégio e proteção de credenciais
O sistema MUST solicitar apenas o escopo `drive.appdata` e MUST manter o token de acesso somente em memória.

#### Scenario: Token não persistido
- **WHEN** a página for recarregada
- **THEN** nenhum token é recuperado do armazenamento local
- **AND** o usuário precisa reconectar para retomar a sincronização

### Requirement: Restauração automática opcional
O sistema SHALL permitir restauração automática ao conectar, quando habilitada pelo usuário.

#### Scenario: Backup remoto mais recente
- **WHEN** a restauração automática estiver habilitada e o backup remoto for válido e mais recente que o local
- **THEN** o sistema restaura o backup remoto nos dados locais

### Requirement: Resolução de conflito previsível
O sistema MUST manter o snapshot com `exportedAt` mais recente e, em empate, o local.

#### Scenario: Snapshots com datas diferentes
- **WHEN** houver snapshot local e remoto válidos com `exportedAt` diferentes
- **THEN** o mais recente prevalece

#### Scenario: Snapshot remoto inválido
- **WHEN** o arquivo remoto não passar na validação de estrutura
- **THEN** o sistema ignora o remoto, mantém o local e informa erro recuperável

### Requirement: Falha de sincronização não bloqueante
O sistema MUST manter a operação local quando a sincronização falhar.

#### Scenario: Erro de rede, permissão ou token expirado
- **WHEN** ocorrer falha no upload ou download
- **THEN** nenhum dado local é perdido ou alterado
- **AND** o sistema mostra estado de erro com opção de tentar novamente ou reconectar

