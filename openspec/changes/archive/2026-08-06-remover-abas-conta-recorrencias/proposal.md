## Why

As abas **Contas** e **Recorrências** existem no menu lateral e na navegação mobile, mas não entregam valor suficiente dentro do fluxo atual do app. Elas adicionam ruído à navegação, dispersam a atenção do usuário e ocupam espaço que poderia ser reservado para funcionalidades mais relevantes.

## What Changes

- Remoção da aba **Contas** (`accounts`) do menu lateral e da navegação mobile
- Remoção da aba **Recorrências** (`recurring`) do menu lateral e da navegação mobile
- Remoção das rotas/renderizações condicionais de `<Accounts />` e `<RecurringTransactions />` no `App.tsx`
- Remoção das importações dos componentes `Accounts` e `RecurringTransactions` no `App.tsx`
- Os componentes em si (`Accounts.tsx`, `RecurringTransactions.tsx`) **não serão deletados** — ficam preservados para uso futuro ou reaproveitamento

## Capabilities

### New Capabilities
- Nenhuma nova capacidade será introduzida

### Modified Capabilities
- `navigation-menu`: A lista de itens do menu lateral e da navegação mobile terá os itens "Contas" e "Recorrências" removidos, simplificando a experiência de navegação

## Impact

- **`src/App.tsx`**: remover imports e renderizações condicionais de `Accounts` e `RecurringTransactions`
- **`src/components/Layout.tsx`**: remover os itens `accounts` e `recurring` do array `menuItems`
- **`src/components/MobileBottomNav.tsx`**: verificar se referencia diretamente esses itens (recebe via props, então é transparente)
- Nenhuma dependência externa afetada
- Sem impacto em dados do Firestore ou lógica de negócio
