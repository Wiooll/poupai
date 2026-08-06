## ADDED Requirements

### Requirement: Gerenciamento de Metas Financeiras
O sistema SHALL permitir que o usuário gerencie metas financeiras (incluir, listar, editar e excluir), onde cada meta possui nome, valor alvo, valor atual e data limite.

#### Scenario: Criação de nova meta
- **WHEN** o usuário preenche o formulário de nova meta com nome, valor e clica em salvar
- **THEN** a meta é incluída na listagem e persistida no armazenamento local

#### Scenario: Visualização do progresso
- **WHEN** o usuário acessa a tela de Metas
- **THEN** o sistema SHALL exibir o progresso (valor atual em relação ao valor alvo) de cada meta, incluindo uma representação visual clara do avanço
