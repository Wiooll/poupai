## Context

Hoje `aiAssistantService.ts` usa modelos fixos: `PROVIDER_MODELS` (`gpt-4o`, `gemini-2.0-flash`) e `GEMINI_FALLBACK_MODELS`. A tela `AIConfigForm` em `Management.tsx` tem provedor, chave, link para obter a chave, "Salvar" e "Testar conexão". As chamadas são feitas direto do navegador com `fetch`, sem backend. A chave fica apenas no `AppConfig` local.

Versão atual do projeto: 4.8.4. Esta funcionalidade nova pede incremento de versão (minor, 4.9.0).

## Goals / Non-Goals

**Goals:**
- Listar modelos reais da chave informada, por provedor.
- Filtrar apenas modelos compatíveis com o assistente.
- Permitir escolher e persistir o modelo (`aiModel`) e usá-lo no teste e no chat.
- Manter o comportamento atual quando não houver modelo escolhido.

**Non-Goals:**
- Suportar novos provedores.
- Mostrar preços, limites ou detalhes técnicos dos modelos.
- Cache persistente da lista de modelos.
- Criar backend ou proxy.

## Decisions

- **Função `listAvailableModels(config)` no serviço existente**: retorna `{ success, models: AIModelOption[], message }`, no mesmo estilo de `testAIConnection`. `AIModelOption = { id: string; label: string }`. Alternativa descartada: novo arquivo de serviço, pois o escopo é pequeno e o serviço já concentra a comunicação com os provedores.
- **OpenAI**: `GET /v1/models` com `Authorization: Bearer`. Essa API não informa capacidades, então o filtro é por id: manter `gpt-*` e `chatgpt-*` (a família `o*` fica de fora porque não aceita `temperature`, usado pelo assistente); excluir ids contendo `embedding`, `whisper`, `tts`, `dall-e`, `moderation`, `audio`, `realtime`, `transcribe`, `image`, `instruct` e `search`. Alternativa descartada: lista fixa de modelos, que fica desatualizada.
- **Gemini**: `GET /v1beta/models?pageSize=1000` com a chave no cabeçalho `x-goog-api-key` (evita a chave na URL e em logs/histórico). Filtro: `supportedGenerationMethods` inclui `generateContent` e nome sem `embedding`, `aqa`, `imagen`, `veo`, `tts`. O prefixo `models/` é removido do id.
- **Uso do modelo escolhido**: função auxiliar `resolveModel(config)` retorna `aiModel` se definido, senão o padrão. No Gemini, com `aiModel` definido não há fallback (o usuário escolheu explicitamente); sem ele, mantém `GEMINI_FALLBACK_MODELS`. Hoje o endpoint do Gemini usa a chave na query; o ajuste para cabeçalho nas chamadas existentes fica fora de escopo.
- **Quando consultar**: botão explícito "Carregar modelos" mais consulta automática ao sair do campo da chave (`onBlur`) se houver chave. Evita requisição a cada tecla. Alternativa descartada: debounce no `onChange`, que envia chaves parciais ao provedor.
- **UI**: `<select>` "Modelo de IA" abaixo da chave, desabilitado sem lista, com opção "Padrão do provedor". Estados de carregando (`Loader2`), erro e vazio, com texto em pt-BR e `aria-live="polite"` na mensagem. Segue as classes Tailwind já usadas no formulário.
- **Persistência**: `aiModel?: string` em `AppConfig`; `handleSave` passa a gravar também `aiModel`. Troca de provedor limpa `aiModel` e a lista, pois ids não são intercambiáveis.
- **Erros**: reaproveitar `formatAIErrorMessage`. Nunca incluir a chave em mensagens ou logs.
- **Corrida de requisições**: ignorar respostas obsoletas (contador de requisição ou `AbortController`) quando provedor ou chave mudam durante a consulta.

## Risks / Trade-offs

- [Heurística de filtro da OpenAI pode incluir/excluir modelos indevidamente] → Filtro isolado em função pura, coberto por testes e fácil de ajustar; modelo padrão continua disponível.
- [Modelo listado pode não suportar JSON ou o formato esperado] → "Testar conexão" usa o modelo escolhido e acusa erro antes do uso real.
- [CORS ou bloqueio de rede na listagem] → Mensagem clara e salvar continua permitido.
- [Chave enviada ao provedor a cada consulta] → Envio só ao provedor selecionado, por ação explícita ou saída do campo; sem logs.
- [Lista grande de modelos do Gemini] → Ordenar por nome e usar `<select>` simples.
- [`aiModel` salvo pode ser descontinuado] → Aviso na tela e fallback ao padrão quando o modelo não for encontrado no teste.

## Migration Plan

Campo opcional novo, sem migração de dados. Usuários existentes continuam com `aiModel` indefinido e o comportamento atual. Reversão: remover o seletor; o campo extra é ignorado.

## Open Questions

- Nenhuma bloqueante. O filtro por id da OpenAI pode precisar de ajuste conforme novos modelos surgirem.
