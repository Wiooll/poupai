## Why

A tela de gestão financeira precisa oferecer melhor aproveitamento de espaço em desktops, permitindo ao usuário ocultar o menu lateral. Além disso, os usuários precisam de uma forma de definir e acompanhar metas financeiras (ex: reserva de emergência, viagem, etc.) para melhor planejamento, sendo esta uma funcionalidade essencial para um dashboard financeiro completo.

## What Changes

- Inclusão de um botão (toggle) no cabeçalho ou menu lateral para recolher/expandir o menu de navegação (apenas desktop).
- Criação de uma nova funcionalidade de "Metas Financeiras" (Goals).
- Interface para adicionar, listar, editar e remover metas (com nome, valor alvo, valor atual, data limite).
- Exibição do progresso de cada meta.
- Adição da aba "Metas" no menu de navegação (lateral no desktop e inferior no mobile).

## Capabilities

### New Capabilities
- `financial-goals`: Funcionalidade completa para gerenciamento de metas financeiras (CRUD de metas e cálculo de progresso).

### Modified Capabilities
- `navigation-menu`: Inclusão do comportamento de recolher/expandir o menu em desktop e adição da nova rota "Metas".
- `mobile-bottom-navigation`: Adição do item "Metas" na barra inferior.

## Impact

- **Layout/UI**: Mudança na estrutura do `Layout.tsx` para suportar o estado de menu recolhido (collapsed) e ajuste nas larguras do conteúdo principal.
- **Estado Global/Contexto**: Necessidade de salvar o estado do menu (recolhido/expandido) possivelmente no `localStorage` para persistência. Novo contexto ou expansão do `FinanceContext` para armazenar os dados de Metas.
- **Componentes**: Criação do novo componente `Goals.tsx` (ou similar) e componentes de formulário para inserção de metas.
