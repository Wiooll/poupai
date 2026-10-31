## ADDED Requirements

### Requirement: Armazenamento local de chave de API
O sistema SHALL permitir que o usuário salve sua própria chave de API de IA nas configurações da aplicação, mantendo-a armazenada de forma persistente.

#### Scenario: Salvar chave de API com sucesso
- **WHEN** o usuário insere sua chave de API e provedor no formulário de configurações e clica em "Salvar"
- **THEN** o sistema deve persistir essas informações no campo `aiApiKey` e `aiProvider` do `AppConfig` no banco de dados local

### Requirement: Mascaramento da chave de API
O sistema SHALL ocultar a chave de API cadastrada na interface do usuário para evitar exposição acidental.

#### Scenario: Visualização segura da chave
- **WHEN** o usuário acessa a tela de Gerenciamento
- **THEN** o campo da chave de API deve exibir apenas asteriscos ou estar oculto, com opção de revelar/alterar
