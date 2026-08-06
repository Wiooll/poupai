## Context

Atualmente, o aplicativo (FinDash) depende do Firebase Firestore para armazenar os dados financeiros dos usuários em tempo real. O estado do aplicativo é mantido sincronizado por meio de escutas ativas (`onSnapshot`) e gravado através de operações CRUD direcionadas à nuvem. A solicitação atual exige a remoção completa do banco de dados em nuvem, transformando a aplicação em um sistema "offline-first" gerido inteiramente por um banco de dados local no navegador.

## Goals / Non-Goals

**Goals:**
- Substituir o Firebase Firestore por uma solução de armazenamento local robusta (IndexedDB).
- Manter o comportamento "reativo" da interface (atualizar a tela automaticamente ao inserir/editar registros).
- Garantir que a aplicação funcione 100% offline.
- Manter e melhorar o sistema de backup/exportação de dados atual para prevenir perda de informações.

**Non-Goals:**
- Criar um novo servidor backend personalizado para substituir o Firebase.
- Implementar sincronização automática entre múltiplos dispositivos (sendo um banco local, a sincronização não é nativa e a transferência de dados deverá ser feita manualmente pelo usuário via importação/exportação).

## Decisions

1. **Tecnologia do Banco de Dados Local: Dexie.js (IndexedDB)**
   - *Rationale*: O IndexedDB é a API nativa dos navegadores para armazenar grandes quantidades de dados estruturados e permite buscas rápidas por índices. Como a API nativa é complexa, usaremos o **Dexie.js**, que fornece uma interface baseada em Promises e integrações fáceis com React (através do hook `useLiveQuery` ou similares) para reatividade, substituindo o papel que o Firestore desempenhava.
   - *Alternative Considered*: Usar apenas `localStorage`. Rejeitada porque o `localStorage` é síncrono (bloqueia a thread principal) e possui um limite de tamanho pequeno (~5MB), o que é insuficiente para históricos longos de transações e contas.

2. **Refatoração do `FinanceContext.tsx`**
   - *Rationale*: Remover as funções `onSnapshot`, `setDoc`, `updateDoc` do Firestore e substitui-las por chamadas assíncronas ao Dexie (ex: `db.transactions.add()`, `db.transactions.put()`). A leitura dos dados no state do React pode ser feita usando os live queries do Dexie para imitar a reatividade original.

3. **Autenticação de Usuário e `userId`**
   - *Rationale*: O Firebase Auth também será desnecessário se não há banco em nuvem. A modelagem de dados será ajustada para não depender de um `userId`, operando em um modo "Single User" por dispositivo.

4. **Remoção Total do Firebase**
   - *Rationale*: O arquivo `src/services/firebase.ts` e as dependências associadas (`firebase`) serão removidas do projeto. Isso reduzirá o tamanho do bundle e melhorará a performance geral e o tempo de carregamento.

## Risks / Trade-offs

- **Risco: Perda de Dados ao Limpar o Navegador**
  - O IndexedDB pode ser apagado se o usuário realizar uma limpeza de cache/dados no navegador.
  - *Mitigation*: Melhorar a visibilidade e facilidade de uso da função de exportar/importar snapshots em JSON (que já existe em `localPersistence.ts`) e sugerir ao usuário que faça backups periódicos do arquivo JSON.

- **Trade-off: Sem sincronização multi-dispositivo**
  - O usuário não poderá adicionar uma despesa no celular e vê-la no PC magicamente.
  - A troca de dados dependerá unicamente de transferência manual do snapshot entre dispositivos.
