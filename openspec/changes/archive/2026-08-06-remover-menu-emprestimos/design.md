## Context

A funcionalidade de "Empréstimos" não faz mais parte da navegação primária da aplicação. Para limpar a interface de usuário tanto no Desktop quanto no Mobile, sua entrada no menu precisa ser ocultada.

## Goals / Non-Goals

**Goals:**
- Remover o ponto de acesso "Empréstimos" da interface principal.
- Não gerar quebras em rotas se a funcionalidade for testada (neste caso o estado deve apenas ignorá-la).

**Non-Goals:**
- Não remover os arquivos, contexto ou estrutura de dados referentes aos "Empréstimos" (`Loan`), já que os dados podem precisar ser acessados ou a funcionalidade pode voltar a ser implementada futuramente. O foco é estritamente ocultá-la.

## Decisions

- **Remoção de item no `menuItems`:** A aba correspondente (`loans`) será removida do array `menuItems` exportado em `src/components/Layout.tsx`.
- **Renderização e Rotas (`App.tsx`):** A condição para renderizar `<Loans />` em `App.tsx` pode ser mantida como segurança, ou removida opcionalmente se quisermos garantir que a view não possa ser atingida de nenhuma maneira. A decisão primária é remover do `Layout.tsx`.

## Risks / Trade-offs

- N/A. Modificação simples de UI, sem impactos estruturais em dados ou lógica persistente.
