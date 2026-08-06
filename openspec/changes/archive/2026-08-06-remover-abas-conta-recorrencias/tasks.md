## 1. Atualizar App.tsx

- [x] 1.1 Remover o import de `RecurringTransactions` em `src/App.tsx`
- [x] 1.2 Remover o import de `Accounts` em `src/App.tsx`
- [x] 1.3 Remover a renderização condicional `{activeTab === 'accounts' && <Accounts />}`
- [x] 1.4 Remover a renderização condicional `{activeTab === 'recurring' && <RecurringTransactions />}`

## 2. Atualizar Layout.tsx

- [x] 2.1 Remover o item `{ id: 'accounts', label: 'Contas', icon: Landmark }` do array `menuItems`
- [x] 2.2 Remover o item `{ id: 'recurring', label: 'Recorrências', icon: Repeat }` do array `menuItems`
- [x] 2.3 Remover o import de `Landmark` em `Layout.tsx` (se não for mais utilizado)
- [x] 2.4 Remover o import de `Repeat` em `Layout.tsx` (se não for mais utilizado)

## 3. Validação

- [x] 3.1 Verificar que o app compila sem erros (`npm run build` ou `npm run dev`)
- [x] 3.2 Confirmar visualmente que "Contas" e "Recorrências" não aparecem no menu lateral (desktop)
- [x] 3.3 Confirmar visualmente que "Contas" e "Recorrências" não aparecem na navegação mobile
- [x] 3.4 Confirmar que as demais abas continuam funcionando normalmente
