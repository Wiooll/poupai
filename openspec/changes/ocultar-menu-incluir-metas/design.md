## Context

A aplicação atualmente possui um layout de navegação fixa (menu lateral no desktop e menu inferior no mobile). O espaço útil em desktop pode ser melhor aproveitado, logo, a introdução de um estado recolhido (collapsed) para o menu lateral se faz necessária.
Além disso, foi identificada a necessidade de adicionar um gerenciador de metas financeiras para os usuários acompanharem seus objetivos (ex. "Comprar Carro", "Viagem", "Reserva de Emergência"), o que requer novas interfaces e manipulação de estado (CRUD).

## Goals / Non-Goals

**Goals:**
- Implementar o estado recolhido (collapsed) do menu lateral, persistindo essa preferência no `localStorage`.
- Implementar um CRUD (Create, Read, Update, Delete) completo de metas financeiras utilizando a camada de persistência local da aplicação.
- Atualizar a navegação principal (Menu desktop e barra mobile) para incluir a rota de Metas.

**Non-Goals:**
- Não haverá sincronização das metas com o Firebase ou outros backends num primeiro momento, apenas persistência baseada na arquitetura atual (`FinanceContext` / local storage).
- O menu inferior mobile não terá estado recolhido (permanecerá sempre visível).

## Decisions

- **Persistência do Estado do Menu:** Utilizar `localStorage` com a chave `findash_sidebar_collapsed` para salvar a preferência do usuário, inicializando esse estado no `Layout.tsx`.
- **Armazenamento de Metas (Goals):** Ampliar as tipagens existentes (ex. em `types.ts`) para incluir a interface `Goal` (`id`, `title`, `targetAmount`, `currentAmount`, `deadline`). Adicionar `goals` ao `FinanceBackupSnapshot` e ao `FinanceContext`.
- **Componente de Metas:** Criar a página `Goals.tsx` responsável por listar as metas, exibindo barras de progresso (utilizando as classes utilitárias do Tailwind) e oferecer diálogos/formulários para a adição e edição.

## Risks / Trade-offs

- **Espaço no Storage:** Ao adicionar mais entidades (`goals`) ao local storage, o limite do navegador pode ser afetado no longo prazo.
  *Mitigação:* As metas geralmente são entidades limitadas (poucos registros), tendo impacto ínfimo no limite de armazenamento.
- **Sobrescrição de Backup (Snapshots):** Garantir que a lógica de backup e restore considere as metas para não causar perda de dados nas exportações e importações de `.json`.
  *Mitigação:* Atualizar o schema de validação (`isValidBackupSnapshot`) em `localPersistence.ts`.
