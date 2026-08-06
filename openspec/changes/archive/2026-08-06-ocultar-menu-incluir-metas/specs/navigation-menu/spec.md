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
