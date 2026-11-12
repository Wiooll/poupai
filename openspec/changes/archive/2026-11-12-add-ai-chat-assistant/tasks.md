## 1. Configuração e Tipagem

- [x] 1.1 Atualizar `types.ts` incluindo `aiApiKey` e `aiProvider` no `AppConfig`.
- [x] 1.2 Atualizar o `FinanceContext.tsx` para garantir que o `AppConfig` inicial inclua esses campos.

## 2. Interface de Configuração (Gerenciamento)

- [x] 2.1 Adicionar seção de "Configurações de IA" na tela `Management.tsx`.
- [x] 2.2 Implementar salvamento seguro da chave e provedor (com máscara de input).

## 3. Serviço de IA

- [x] 3.1 Criar `src/services/aiAssistantService.ts` com lógica para montar contexto (contas/categorias/saldos).
- [x] 3.2 Implementar integração com API (OpenAI/Gemini) respeitando a chave inserida pelo usuário.

## 4. Widget de Chat (UI)

- [x] 4.1 Criar componente `src/components/AiChatWidget.tsx` (botão flutuante e modal de chat).
- [x] 4.2 Integrar `AiChatWidget` no `Layout.tsx` (ajustando posicionamento e responsividade).

## 5. Fluxo de Interação e Integração

- [x] 5.1 Implementar lógica de processamento de mensagem e exibição do Card de Prévia.
- [x] 5.2 Implementar callback de "Confirmar" no card, chamando métodos do `FinanceContext`.
- [x] 5.3 Implementar lógica de perguntas/respostas para consultas de histórico/saldos.
