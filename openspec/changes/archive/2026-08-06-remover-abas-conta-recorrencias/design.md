## Context

O app **Findash** possui um menu lateral (desktop) e uma navegação mobile inferior (`MobileBottomNav`). Atualmente o menu exibe 11 itens, incluindo **Contas** e **Recorrências**. Ambas as abas foram identificadas como de baixo valor para o fluxo atual, gerando ruído desnecessário na navegação.

A navegação é controlada por um array `menuItems` em `Layout.tsx`, e o roteamento é feito por renderização condicional em `App.tsx`.

## Goals / Non-Goals

**Goals:**
- Remover as entradas "Contas" e "Recorrências" do `menuItems` em `Layout.tsx`
- Remover as renderizações condicionais de `<Accounts />` e `<RecurringTransactions />` em `App.tsx`
- Remover os imports desnecessários em `App.tsx`
- Simplificar o menu de navegação de 11 para 9 itens

**Non-Goals:**
- Deletar os arquivos `Accounts.tsx` e `RecurringTransactions.tsx` (preservados para uso futuro)
- Alterar a lógica interna dos componentes
- Alterar a estrutura de dados no Firestore
- Criar novas rotas ou reorganizar as demais abas

## Decisions

**Decisão 1: Preservar os componentes no filesystem**
- Manter `Accounts.tsx` e `RecurringTransactions.tsx` sem exclusão
- Motivo: preservar o trabalho já feito para eventual reaproveitamento; a remoção é somente da navegação, não da funcionalidade

**Decisão 2: Remoção direta dos itens do array `menuItems`**
- Alternativa considerada: usar uma feature flag para ocultar os itens
- Escolha: remoção direta — a mudança é intencional e definitiva; feature flags adicionariam complexidade desnecessária

**Decisão 3: Não alterar o activeTab padrão**
- O estado inicial permanece `'dashboard'`, não há risco de o usuário cair numa aba removida

## Risks / Trade-offs

- **[Risco] Links diretos ou bookmarks para `#accounts` ou `#recurring`** → Mitigation: o app não usa URL params para rotas; sem impacto
- **[Trade-off] Componentes órfãos no código** → Aceito conscientemente; eles não são importados no bundle final pois os imports serão removidos de `App.tsx` (tree-shaking pelo Vite)
