## 1. Tipagem e estado

- [x] 1.1 Adicionar `aiModel?: string` ao `AppConfig` em `src/types.ts`.
- [x] 1.2 Incluir `aiModel: undefined` nos valores iniciais/reset de config em `src/context/FinanceContext.tsx`.

## 2. Serviço de modelos

- [x] 2.1 Criar o tipo `AIModelOption` e a função pura de filtro de compatibilidade da OpenAI em `aiAssistantService.ts`.
- [x] 2.2 Criar a função pura de filtro do Gemini (`generateContent`, exclusões e remoção do prefixo `models/`).
- [x] 2.3 Implementar `listAvailableModels(config)` com `GET /v1/models` (OpenAI) e `GET /v1beta/models` com `x-goog-api-key` (Gemini), tratando erros com `formatAIErrorMessage`.
- [x] 2.4 Criar `resolveModel(config)` e usar `aiModel` em `testAIConnection` e nas chamadas do chat, mantendo padrão e fallback quando `aiModel` não estiver definido.
- [x] 2.5 Garantir que a chave nunca apareça em logs ou mensagens de erro.

## 3. Interface

- [x] 3.1 Em `AIConfigForm` (`Management.tsx`), adicionar estados de modelos, carregamento e erro da listagem.
- [x] 3.2 Adicionar botão "Carregar modelos" e consulta automática no `onBlur` do campo da chave, ignorando respostas obsoletas.
- [x] 3.3 Adicionar `<select>` "Modelo de IA" com opção "Padrão do provedor", desabilitado sem lista, com mensagens em pt-BR e `aria-live="polite"`.
- [x] 3.4 Limpar lista e `aiModel` ao trocar provedor; limpar lista ao alterar a chave.
- [x] 3.5 Avisar quando o `aiModel` salvo não estiver na lista carregada.
- [x] 3.6 Gravar `aiModel` em `handleSave` e passá-lo a `testAIConnection`.

## 4. Testes e validação

- [x] 4.1 Testar em `aiAssistantService.test.ts` os filtros da OpenAI e do Gemini (modelos compatíveis e excluídos).
- [x] 4.2 Testar `listAvailableModels` com `fetch` simulado: sucesso, chave inválida, falha de rede e lista vazia.
- [x] 4.3 Testar `resolveModel` e o uso do `aiModel` em `testAIConnection`.
- [x] 4.4 Rodar lint, testes e build e corrigir problemas.
- [x] 4.5 Revisar a ortografia pt-BR de todos os textos novos da interface.

## 5. Documentação e versão

- [x] 5.1 Atualizar o README.md descrevendo a listagem e a seleção de modelos.
- [x] 5.2 Atualizar o CHANGELOG.md.
- [x] 5.3 Subir a versão para 4.9.0 no `package.json` e onde ela é exibida ao usuário.
- [x] 5.4 Preparar o resumo das alterações para a descrição do commit em pt-BR.
