## MODIFIED Requirements

### Requirement: Menu de navegação exibe apenas as abas ativas
O sistema SHALL exibir no menu lateral (desktop) e na navegação inferior (mobile) somente as abas com funcionalidade ativa. As abas **Contas**, **Recorrências** e **Empréstimos** SHALL ser removidas da lista de navegação.

#### Scenario: Menu lateral desktop não exibe aba Contas
- **WHEN** o usuário acessa o app em desktop
- **THEN** o menu lateral NÃO SHALL exibir o item "Contas"

#### Scenario: Menu lateral desktop não exibe aba Recorrências
- **WHEN** o usuário acessa o app em desktop
- **THEN** o menu lateral NÃO SHALL exibir o item "Recorrências"

#### Scenario: Menu lateral desktop não exibe aba Empréstimos
- **WHEN** o usuário acessa o app em desktop
- **THEN** o menu lateral NÃO SHALL exibir o item "Empréstimos"

#### Scenario: Navegação mobile não exibe aba Contas
- **WHEN** o usuário acessa o app em mobile
- **THEN** a barra de navegação inferior NÃO SHALL exibir o item "Contas"

#### Scenario: Navegação mobile não exibe aba Recorrências
- **WHEN** o usuário acessa o app em mobile
- **THEN** a barra de navegação inferior NÃO SHALL exibir o item "Recorrências"

#### Scenario: Navegação mobile não exibe aba Empréstimos
- **WHEN** o usuário acessa o app em mobile
- **THEN** a barra de navegação inferior NÃO SHALL exibir o item "Empréstimos"

#### Scenario: Acesso direto via estado interno não renderiza componentes removidos
- **WHEN** o estado `activeTab` for `'accounts'`, `'recurring'` ou `'loans'`
- **THEN** o sistema NÃO SHALL renderizar nenhum conteúdo para essas abas (comportamento indefinido — sem rota pública)

## ADDED Requirements

### Requirement: Opção de recolher e expandir o menu lateral
O sistema SHALL disponibilizar no desktop um botão ou opção para recolher (ocultar) e expandir o menu lateral de navegação.

#### Scenario: Alternar estado do menu lateral
- **WHEN** o usuário clica na opção de ocultar o menu
- **THEN** o menu lateral SHALL encolher ou ser ocultado, maximizando a área principal de conteúdo
- **AND** o estado SHALL ser lembrado em futuros acessos

### Requirement: Aba de Metas
O menu lateral (desktop) SHALL incluir um item de navegação para a nova funcionalidade de "Metas".

#### Scenario: Navegar para Metas via menu
- **WHEN** o usuário clica no item "Metas" do menu lateral
- **THEN** a tela de listagem de metas SHALL ser renderizada