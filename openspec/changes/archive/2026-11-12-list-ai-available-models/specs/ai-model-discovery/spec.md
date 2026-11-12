## ADDED Requirements

### Requirement: Listar modelos disponíveis ao informar a chave
O sistema SHALL consultar o provedor selecionado usando a chave de API informada e listar os modelos disponíveis para essa chave nas Configurações de IA.

#### Scenario: Listagem automática ao informar a chave
- **WHEN** o usuário informa uma chave de API não vazia e sai do campo ou aciona "Carregar modelos"
- **THEN** o sistema consulta o provedor selecionado e exibe os modelos retornados em um campo de seleção

#### Scenario: Troca de provedor ou de chave
- **WHEN** o usuário altera o provedor ou a chave de API
- **THEN** o sistema limpa a lista de modelos e o resultado do teste anteriores e exige nova consulta

#### Scenario: Chave vazia
- **WHEN** o campo de chave de API está vazio
- **THEN** o sistema não consulta o provedor e mantém o seletor de modelos desabilitado

### Requirement: Exibir somente modelos compatíveis
O sistema SHALL exibir apenas modelos compatíveis com o assistente, isto é, que gerem texto a partir de conversa, excluindo embeddings, áudio, imagem, moderação, vídeo e similares.

#### Scenario: Filtro de modelos OpenAI
- **WHEN** a API da OpenAI retorna modelos de chat e também de embeddings, áudio, imagem ou moderação
- **THEN** o sistema lista somente os modelos de chat/texto

#### Scenario: Filtro de modelos Gemini
- **WHEN** a API do Gemini retorna modelos
- **THEN** o sistema lista somente os que suportam o método `generateContent`

#### Scenario: Nenhum modelo compatível
- **WHEN** a consulta é bem-sucedida, mas nenhum modelo passa no filtro
- **THEN** o sistema exibe a mensagem "Nenhum modelo compatível encontrado para esta chave." e mantém o modelo padrão

### Requirement: Selecionar e persistir o modelo
O sistema SHALL permitir ao usuário escolher um dos modelos listados e persistir a escolha em `aiModel` no `AppConfig` ao salvar as configurações.

#### Scenario: Salvar modelo escolhido
- **WHEN** o usuário seleciona um modelo e clica em "Salvar configurações"
- **THEN** o sistema persiste `aiModel` junto com `aiApiKey` e `aiProvider`

#### Scenario: Uso do modelo escolhido
- **WHEN** o usuário testa a conexão ou envia mensagem ao assistente com `aiModel` definido
- **THEN** o sistema usa o modelo escolhido na chamada ao provedor

#### Scenario: Sem modelo escolhido
- **WHEN** `aiModel` não está definido
- **THEN** o sistema usa o modelo padrão do provedor e, no Gemini, o fallback já existente

#### Scenario: Modelo salvo deixou de estar disponível
- **WHEN** a lista carregada não contém o `aiModel` salvo
- **THEN** o sistema avisa o usuário e não seleciona outro modelo automaticamente

### Requirement: Tratamento de falhas na listagem
O sistema SHALL exibir mensagens claras em português do Brasil quando a listagem falhar, sem impedir o salvamento da chave e do provedor.

#### Scenario: Chave inválida
- **WHEN** o provedor responde com erro de autenticação
- **THEN** o sistema exibe a mensagem de chave inválida já padronizada e mantém a lista vazia

#### Scenario: Falha de rede ou CORS
- **WHEN** a requisição de listagem falha por rede ou restrição de CORS
- **THEN** o sistema exibe mensagem de falha de conexão e permite salvar a chave mesmo assim

#### Scenario: Chave não exposta
- **WHEN** a listagem falha ou é bem-sucedida
- **THEN** o sistema não registra a chave de API em logs nem em mensagens exibidas
