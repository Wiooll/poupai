## Why

O assistente de IA apresenta falhas ao ser utilizado pelos usuários, principalmente por incompatibilidade de identificadores de modelo na API do Google Gemini (como o uso de modelos inexistentes ou instáveis no endpoint REST), ausência de sanitização de respostas em formato markdown (quando a IA envolve o JSON em blocos de código), falta de feedback diagnóstico/teste de conexão na tela de configuração e problemas de posicionamento do botão flutuante em telas móveis sobre a barra de navegação.

Corrigir a causa raiz da integração e oferecer ferramentas de diagnóstico garante que os usuários consigam conectar suas chaves de API com sucesso e utilizar o assistente conversacional com estabilidade.

## What Changes

- **Suporte a Modelos Ativos e Fallback Resiliente**: Atualização dos identificadores e endpoints da API do Gemini (priorizando modelos estáveis como `gemini-2.0-flash` e `gemini-1.5-flash`) com mecanismo de fallback gracioso caso um modelo específico não esteja disponível para a chave utilizada.
- **Formatação Estruturada e Extração Segura de JSON**: Configuração explícita de `responseMimeType: "application/json"` nas requisições do Gemini e sanitização robusta no parser para extrair objetos JSON mesmo se forem retornados dentro de blocos markdown (```json ... ```).
- **Diagnóstico e Teste de Chave de API**: Adição de uma função de teste de conexão com a API nas Configurações de IA em `Management.tsx`, exibindo se a chave está válida e qual modelo respondeu.
- **Tratamento de Erros Amigável e Detalhado**: Mapeamento de erros HTTP típicos (400 - Chave inválida, 403 - Sem permissão, 404 - Modelo inexistente, 429 - Limite de requisições excedido) com mensagens claras em português brasileiro no chat.
- **Ajuste de Usabilidade e Posicionamento Mobile**: Adequação do espaçamento inferior do widget de chat em dispositivos móveis para não sobrepor nem ser encoberto pela `MobileBottomNav`.

## Capabilities

### New Capabilities
- `ai-chat-resilience`: Resiliência nas chamadas aos provedores de IA com sanitização de respostas JSON, fallbacks de modelos estáveis e tratamento de erros descritivos.
- `ai-connection-testing`: Funcionalidade de validação e teste de conexão da chave de API e provedor diretamente na aba de Gerenciamento.

### Modified Capabilities
- Nenhuma capacidade existente teve requisitos funcionais quebrados.

## Impact

- **Serviços (`src/services/aiAssistantService.ts`)**: Atualização de modelos, endpoints, sanitização de JSON, inclusão de função `testAIConnection` e tratamento refinado de erros da API.
- **Componentes (`src/components/Management.tsx`)**: Inclusão de botão para testar conexão da chave de API configurada com feedback visual.
- **Componentes (`src/components/AiChatWidget.tsx`)**: Ajustes de posicionamento responsivo no mobile e exibição de mensagens amigáveis de erro da API.

