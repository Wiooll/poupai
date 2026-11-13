# app-branding Specification

## Purpose
TBD - created by archiving change rename-app-poupai. Update Purpose after archive.
## Requirements
### Requirement: Nome oficial do aplicativo
O sistema SHALL usar "PoupAi" como nome oficial do aplicativo em toda a interface visível ao usuário, definido em uma constante central `APP_NAME`.

#### Scenario: Nome exibido na interface
- **WHEN** o usuário abre o aplicativo (tela de entrada, menu lateral, cabeçalho mobile, rodapé, título da aba do navegador)
- **THEN** o nome exibido é "PoupAi"
- **AND** nenhum texto visível exibe "FinDash"

#### Scenario: Textos institucionais e de suporte
- **WHEN** o usuário abre termos, privacidade, "Apoie o PoupAi", atualizações ou o assistente de IA
- **THEN** os textos referenciam "PoupAi"

### Requirement: Nome do aplicativo em conteúdo gerado
O sistema SHALL usar "PoupAi" em e-mails de feedback, relatórios e arquivos exportados.

#### Scenario: E-mail de feedback
- **WHEN** o usuário clicar em "Enviar sugestão" ou "Reportar bug"
- **THEN** o assunto contém `[PoupAi] Sugestão` ou `[PoupAi] Bug`
- **AND** o corpo cumprimenta a "equipe PoupAi"

#### Scenario: Arquivos e relatório exportados
- **WHEN** o usuário exportar backup ou transações
- **THEN** o nome do arquivo começa com `poupai`
- **AND** o relatório de impressão exibe "PoupAi" no título

#### Scenario: Metadado de backup
- **WHEN** um novo backup for gerado
- **THEN** o campo `app` do snapshot é "PoupAi"

### Requirement: Compatibilidade com dados existentes
O sistema SHALL preservar identificadores internos de armazenamento ao renomear o aplicativo.

#### Scenario: Dados locais preservados
- **WHEN** um usuário com dados criados como FinDash abrir a nova versão
- **THEN** o banco local e as preferências são carregados normalmente

#### Scenario: Restauração de backup antigo
- **WHEN** o usuário restaurar um backup cujo campo `app` seja "FinDash"
- **THEN** o backup é aceito e restaurado

