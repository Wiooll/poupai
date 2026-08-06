## 1. Atualizar Tipagens e Contexto Base

- [x] 1.1 Adicionar tipagem `Goal` em `src/types.ts` (id, title, targetAmount, currentAmount, deadline).
- [x] 1.2 Atualizar `FinanceBackupSnapshot` e outras tipagens relacionadas em `src/types.ts` para suportar `goals`.
- [x] 1.3 Adicionar estado de metas (`goals`) e métodos de CRUD (`addGoal`, `updateGoal`, `deleteGoal`) no `FinanceContext.tsx`.

## 2. Refatorar Layout e Menu Lateral

- [x] 2.1 Adicionar estado `isSidebarCollapsed` no `Layout.tsx` lendo o estado inicial do `localStorage` (`findash_sidebar_collapsed`).
- [x] 2.2 Criar botão no cabeçalho ou topo do sidebar para alternar (toggle) o estado de recolhimento.
- [x] 2.3 Ajustar as classes CSS (Tailwind) do `Layout.tsx` e dos itens do menu para lidar com o estado encolhido (esconder texto, exibir apenas ícones, ajustar larguras).
- [x] 2.4 Salvar a mudança de estado do sidebar no `localStorage` sempre que houver alteração.

## 3. Adicionar Nova Rota e Navegação (Metas)

- [x] 3.1 Adicionar a aba `goals` na lista de itens de menu do desktop (`menuItems`) em `Layout.tsx`.
- [x] 3.2 Adicionar o ícone/botão de `Metas` na navegação inferior mobile (Bottom Navigation) em `Layout.tsx`.
- [x] 3.3 Configurar renderização condicional ou rotas no `App.tsx` para renderizar o componente `Goals` quando a aba ativa for `goals`.

## 4. Implementar a Tela de Metas

- [x] 4.1 Criar o componente base `src/components/Goals.tsx`.
- [x] 4.2 Desenvolver a listagem de metas exibindo o progresso (barras percentuais) e as informações detalhadas.
- [x] 4.3 Desenvolver o formulário (em modal ou inline) para a criação e edição de metas (nome, valor alvo, valor atual, data limite).
- [x] 4.4 Integrar o formulário e a listagem com o `FinanceContext`.

## 5. Validação e Testes

- [x] 5.1 Verificar se as opções de expandir/recolher funcionam fluidamente no desktop e mantêm o estado ao recarregar a página.
- [x] 5.2 Testar a criação, edição e remoção de uma meta financeira e validar a precisão da barra de progresso.
- [x] 5.3 Exportar um backup JSON local para garantir que as `goals` estão sendo serializadas e salvas corretamente no formato de backup.
