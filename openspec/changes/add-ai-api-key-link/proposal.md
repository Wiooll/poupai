## Why

Na aba **Gerenciamento > Configurações de IA**, o usuário precisa informar uma chave de API (OpenAI ou Google Gemini), mas o app não indica onde obtê-la. Isso gera abandono na configuração do assistente de IA e aumenta pedidos de suporte.

## What Changes

- Adicionar, no formulário de Configurações de IA, um link externo "Obter chave de API" que muda conforme o provedor selecionado:
  - OpenAI: `https://platform.openai.com/api-keys`
  - Google Gemini: `https://aistudio.google.com/app/apikey`
- O link abre em nova aba com `target="_blank"` e `rel="noopener noreferrer"`.
- Atualizar a versão do app (visível ao usuário), a aba **Atualizações**, o `CHANGELOG.md` e o `README.md`.

## Capabilities

### New Capabilities
- `ai-api-key-help-link`: link contextual para o usuário obter a chave de API do provedor de IA selecionado.

### Modified Capabilities

## Impact

- Código: `src/components/Management.tsx` (componente `AIConfigForm`); possível constante de URLs por provedor.
- Versão/documentação: `package.json`, tela de Atualizações, `CHANGELOG.md`, `README.md`.
- Sem novas dependências, sem alteração de dados persistidos e sem chamadas de rede adicionais (link estático).
- Segurança: URLs fixas no código (sem entrada do usuário), com `rel="noopener noreferrer"`.
