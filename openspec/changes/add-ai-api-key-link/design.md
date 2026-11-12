## Context

O componente `AIConfigForm` (em `src/components/Management.tsx`) já possui o seletor de provedor (`openai` | `gemini`) e o campo de chave de API, mas não orienta o usuário sobre onde gerar a chave. O projeto já usa links externos seguros (card de App Parceiro) com `target="_blank"` e `rel="noopener noreferrer"`.

## Goals / Non-Goals

**Goals:**
- Exibir link "Obter chave de API" que acompanha o provedor selecionado.
- Manter abertura segura em nova aba.
- Seguir o padrão visual existente (Tailwind, ícones `lucide-react`).

**Non-Goals:**
- Não criar fluxo de OAuth nem obter a chave automaticamente.
- Não alterar armazenamento, validação ou teste de conexão da chave.
- Não permitir URLs configuráveis pelo usuário.

## Decisions

- **Mapa de URLs por provedor**: constante `AI_API_KEY_URLS: Record<NonNullable<AppConfig['aiProvider']>, string>` definida junto ao componente (ou em `src/constants`, se já houver arquivo adequado). Alternativa descartada: ler de variável de ambiente, pois as URLs oficiais são estáveis e públicas.
- **Posição**: abaixo do campo "Chave de API", ao lado do texto de privacidade existente, usando `<a>` com ícone `ExternalLink`.
- **Provedor padrão**: o formulário já usa `'openai'` como fallback; o link segue o mesmo valor (`aiProvider || 'openai'`).
- **Acessibilidade**: texto descritivo claro (ex.: "Obter chave de API da OpenAI") e `aria-label` indicando abertura em nova aba.
- **Versão**: incremento de patch/minor (4.8.4) em `app.ts`, `package.json`, `package-lock.json` e `releases.ts`.

## Risks / Trade-offs

- [URL oficial do provedor mudar] → Mitigação: URLs centralizadas em uma única constante, fácil de ajustar.
- [Erro de ortografia pt-BR na interface] → Mitigação: executar `npm run check:text-ptbr-ui` e `npm run check:text-encoding`.
