## ADDED Requirements

### Requirement: Chamada resiliente à API do Gemini
O sistema DEVE suportar modelos ativos e oficiais do Google Gemini (como `gemini-2.0-flash` e `gemini-1.5-flash`), com fallback automático caso o modelo primário retorne erro de modelo não encontrado ou não suportado.

#### Scenario: Chamada bem-sucedida ao modelo padrão
- **WHEN** o usuário envia uma mensagem no chat com provedor Gemini configurado
- **THEN** o sistema envia a requisição para o endpoint ativo da API do Gemini e recebe a resposta estruturada

#### Scenario: Fallback automático quando o modelo primário falhar
- **WHEN** a API do Gemini retorna código HTTP 404 indicando modelo não encontrado
- **THEN** o serviço tenta automaticamente o modelo secundário estável antes de retornar erro ao usuário

### Requirement: Extração e sanitização de respostas em JSON
O sistema DEVE sanitizar e extrair com segurança o objeto JSON da resposta do provedor de IA, inclusive quando o modelo retornar blocos formatados em markdown (```json ... ```) ou texto introdutório.

#### Scenario: Resposta envelopada em bloco markdown de código
- **WHEN** o modelo de IA responde com JSON encapsulado em delimitadores ````json { ... } ````
- **THEN** o sistema extrai o conteúdo JSON interno, realiza o parsing e identifica corretamente se é uma `ACTION_PROPOSAL` ou `QUERY_RESPONSE`

#### Scenario: Resposta em formato de texto livre
- **WHEN** o modelo de IA responde em texto sem estrutura JSON válida
- **THEN** o sistema trata o conteúdo como `QUERY_RESPONSE` sem lançar exceções não tratadas

### Requirement: Mensagens de erro claras e amigáveis
O sistema DEVE mapear os erros mais comuns da API de IA e exibir mensagens claras e acionáveis em português brasileiro.

#### Scenario: Chave de API inválida
- **WHEN** a requisição falha com erro de autenticação ou chave inválida (HTTP 400 ou 401)
- **THEN** o chat exibe mensagem orientando o usuário a verificar e atualizar sua chave de API nas configurações

#### Scenario: Limite de cota atingido
- **WHEN** a requisição falha com código HTTP 429 (Too Many Requests / Quota Exceeded)
- **THEN** o chat informa que o limite da chave de API foi atingido temporariamente

