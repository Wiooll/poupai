## Why

O item "Empréstimos" no menu não é mais necessário ou desejado para a navegação principal do aplicativo. A sua remoção simplifica a interface e reduz o número de abas disponíveis no menu lateral (desktop) e inferior (mobile).

## What Changes

- Remoção do item `loans` (Empréstimos) da lista de navegação do menu no `Layout.tsx`.
- Ocultar a interface de Empréstimos da visão principal do usuário ao navegar pelas rotas disponíveis.

## Capabilities

### New Capabilities
Nenhuma nova capability introduzida.

### Modified Capabilities
- `navigation-menu`: O menu de navegação não deverá mais exibir a opção para acessar a funcionalidade de "Empréstimos".

## Impact

- **Código Afetado**: `src/components/Layout.tsx`.
- **Experiência do Usuário**: A aba de empréstimos não estará mais visível para acesso, limpando a navegação. O código e contexto relacionados aos empréstimos podem ser mantidos internamente caso a funcionalidade volte no futuro, mas o ponto de acesso será removido.
