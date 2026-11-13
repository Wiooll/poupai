## REMOVED Requirements

### Requirement: Autenticação de usuário com Firebase Auth
Motivo: o app não possui mais login; opera com usuário local (`local-user`). A conexão Google passa a existir apenas como autorização opcional do Drive, descrita em `google-drive-automatic-backup`.

### Requirement: Proteção de rotas e sessão
Motivo: não há sessão autenticada no modelo offline-first atual.

### Requirement: Encerramento de sessão
Motivo: substituído pela ação "Desconectar Drive", coberta em `google-drive-automatic-backup`.
