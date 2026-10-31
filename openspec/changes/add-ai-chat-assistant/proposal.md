## Why

Adicionar lançamentos e consultar informações financeiras por formulários manuais nem sempre é a forma mais rápida ou intuitiva para os usuários. Uma interface de chat com assistente de IA permite que o usuário gerencie lançamentos (inserção/atualização/consulta) e faça perguntas em linguagem natural de forma rápida, eficiente e acessível de qualquer lugar da aplicação.

## What Changes

- **Assistente Financeiro via Chat Flutuante**: Novo botão flutuante (*floating widget*) acessível em todas as telas que abre uma janela de conversa interativa estilo chat.
- **Integração com API de IA**: Suporte a chamadas para provedores de IA (como OpenAI/Gemini), utilizando a chave de API fornecida pelo próprio usuário.
- **Lançamentos e Ações via Chat**: Capacidade de processar frases em linguagem natural, oferecendo um card de prévia/confirmação para ações de inserção/atualização de transações no `FinanceContext`.
- **Consultas em Linguagem Natural**: Respostas a perguntas sobre o histórico financeiro, saldos e resumo por categorias.
- **Configuração de Chave de API**: Seção dedicada na tela de Gerenciamento (`Management.tsx`) para o usuário cadastrar e armazenar com segurança sua chave de API localmente em sua configuração (`AppConfig`).

## Capabilities

### New Capabilities
- `ai-chat-assistant`: Interface de assistente conversacional estilo chat flutuante para interação natural, criação/edição de lançamentos e consulta de dados.
- `ai-api-configuration`: Gerenciamento e armazenamento seguro de chaves de API e preferências do provedor de IA no `AppConfig`.

### Modified Capabilities
- Nenhuma capacidade existente teve seus requisitos alterados.

## Impact

- **Interface do Usuário**: Inclusão do `AiChatWidget` no `Layout.tsx` e atualização da aba de Gerenciamento (`Management.tsx`).
- **Estado e Tipos**: Extensão de `AppConfig` em `src/types.ts` para incluir campos de chave de API (`aiApiKey`, `aiProvider`).
- **Serviços**: Criação de `aiAssistantService.ts` para orquestração de prompts, injeção de contexto financeiro e comunicação com a API de IA.
