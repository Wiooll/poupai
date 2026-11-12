## Why

Hoje o modelo de IA é fixo no código (`gpt-4o` para OpenAI e `gemini-2.0-flash`/`gemini-1.5-flash` para Gemini). Se a chave do usuário não tem acesso a um desses modelos, a conexão falha com erro genérico. O usuário também não sabe quais modelos sua chave realmente suporta nem pode escolher um.

## What Changes

- Ao informar a chave de API (e escolher o provedor), o sistema consulta o provedor e lista os modelos disponíveis para aquela chave.
- A lista exibe apenas modelos compatíveis com o assistente (geração de texto/chat com resposta em JSON), filtrando embeddings, áudio, imagem, moderação etc.
- O usuário pode selecionar o modelo desejado em um campo de seleção em **Gerenciamento > Configurações de IA**.
- O modelo escolhido é salvo em `AppConfig` (`aiModel`) e usado pelo assistente e pelo teste de conexão.
- Sem modelo escolhido, mantém-se o comportamento atual (modelos padrão e fallback do Gemini).
- Falhas na listagem (chave inválida, rede, CORS) exibem mensagem clara em pt-BR e não impedem salvar a chave.
- Atualização do README.md, do CHANGELOG e da versão exibida ao usuário.

## Capabilities

### New Capabilities
- `ai-model-discovery`: listagem de modelos disponíveis e compatíveis por provedor a partir da chave de API, seleção do modelo pelo usuário e persistência da escolha (`aiModel`) junto com chave e provedor.

### Modified Capabilities
<!-- Nenhuma: `ai-api-configuration` ainda está na change `add-ai-chat-assistant` e não existe em openspec/specs/. -->


## Impact

- `src/types.ts`: novo campo opcional `aiModel` em `AppConfig`.
- `src/context/FinanceContext.tsx`: valor inicial do campo.
- `src/services/aiAssistantService.ts`: nova função `listAvailableModels`, filtro de compatibilidade e uso do modelo escolhido em `testAIConnection` e nas chamadas do chat.
- `src/components/Management.tsx`: seletor de modelo, botão/ação de carregar modelos e estados de carregamento/erro.
- APIs externas: `GET https://api.openai.com/v1/models` e `GET https://generativelanguage.googleapis.com/v1beta/models`. Nenhuma dependência nova.
- Segurança: a chave continua apenas local e só é enviada ao provedor escolhido; não deve ser registrada em logs.
- Documentação: README.md, CHANGELOG.md e versão no `package.json` e na interface.
