## 1. Resiliência do Serviço de IA

- [x] 1.1 Configurar modelo principal `gemini-2.0-flash` e endpoint v1beta com fallback automático para `gemini-1.5-flash` em `aiAssistantService.ts`
- [x] 1.2 Implementar utilitário `extractJsonFromText` para remover delimitadores markdown e extrair JSON com segurança
- [x] 1.3 Incluir configuração `responseMimeType: "application/json"` nas requisições do Gemini
- [x] 1.4 Mapear e detalhar mensagens amigáveis de erro HTTP (400, 401, 404, 429) em português brasileiro
- [x] 1.5 Criar função exportada `testAIConnection` para validação rápida de chaves de API

## 2. Testes de Validação

- [x] 2.1 Criar suite de testes unitários para `extractJsonFromText` e simulação de erros em `src/services/aiAssistantService.test.ts`
- [x] 2.2 Executar testes automatizados para validar que as funções atendem aos cenários

## 3. Interface de Diagnóstico e Ajuste Responsivo

- [x] 3.1 Integrar botão de teste de conexão com feedback de status na seção de Configurações de IA em `Management.tsx`
- [x] 3.2 Ajustar espaçamento inferior responsivo do `AiChatWidget.tsx` (`bottom-20 md:bottom-8`) para não colidir com o menu mobile

## 4. Finalização e Documentação

- [x] 4.1 Atualizar versão do app para 4.8.3 em `app.ts`, `package.json` e adicionar notas de release em `releases.ts`
- [x] 4.2 Atualizar documentação no `README.md` refletindo as melhorias no assistente de IA
- [x] 4.3 Executar validação de build completa do projeto
