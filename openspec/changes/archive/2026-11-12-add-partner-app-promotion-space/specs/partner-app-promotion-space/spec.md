## ADDED Requirements

### Requirement: Exibir Espaco de Divulgacao de App Parceiro
O sistema SHALL exibir um card de app parceiro na pagina de Gerenciamento quando a configuracao minima obrigatoria estiver valida.

#### Scenario: Card exibido com configuracao valida
- **WHEN** `VITE_PARTNER_APP_NAME` e `VITE_PARTNER_APP_URL` estiverem preenchidos e a URL for valida
- **THEN** o sistema deve renderizar o card "App Parceiro" com nome, descricao e CTA

#### Scenario: Card ocultado sem configuracao minima
- **WHEN** o nome do parceiro estiver vazio ou a URL estiver ausente/invalida
- **THEN** o sistema nao deve renderizar o card de divulgacao

### Requirement: Garantir Navegacao Externa Segura
O sistema MUST abrir o link do app parceiro em nova aba com protecao de navegacao externa.

#### Scenario: Clique no CTA do parceiro
- **WHEN** o usuario clicar no botao do card de app parceiro
- **THEN** o link deve abrir em nova aba com `target="_blank"` e `rel="noreferrer"`

### Requirement: Transparencia de Conteudo Parceiro
O sistema SHALL informar de forma clara que o card representa divulgacao de app parceiro.

#### Scenario: Visualizacao do card na pagina
- **WHEN** o card de app parceiro estiver visivel
- **THEN** a interface deve incluir texto curto indicando que se trata de conteudo parceiro
