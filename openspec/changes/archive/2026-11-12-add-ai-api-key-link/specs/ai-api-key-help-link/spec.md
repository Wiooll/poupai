## ADDED Requirements

### Requirement: Link para obter chave de API do provedor selecionado
O sistema SHALL exibir, no formulário de Configurações de IA da aba Gerenciamento, um link "Obter chave de API" apontando para a página oficial de criação de chaves do provedor de IA selecionado.

#### Scenario: Provedor OpenAI selecionado
- **WHEN** o provedor selecionado é OpenAI
- **THEN** o link aponta para `https://platform.openai.com/api-keys`

#### Scenario: Provedor Gemini selecionado
- **WHEN** o provedor selecionado é Google Gemini
- **THEN** o link aponta para `https://aistudio.google.com/app/apikey`

#### Scenario: Troca de provedor
- **WHEN** o usuário altera o provedor no seletor
- **THEN** o destino do link é atualizado imediatamente, sem salvar a configuração

### Requirement: Abertura segura do link externo
O sistema MUST abrir o link em nova aba com `rel="noopener noreferrer"`, usando apenas URLs fixas definidas no código.

#### Scenario: Clique no link
- **WHEN** o usuário clica em "Obter chave de API"
- **THEN** a página oficial abre em nova aba e o FinDash permanece aberto, sem enviar dados do usuário ou a chave informada
