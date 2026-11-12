## ADDED Requirements

### Requirement: Teste de conexão com a API de IA
O sistema DEVE disponibilizar uma ação de teste de conexão na tela de Gerenciamento para validar a chave e o provedor selecionado.

#### Scenario: Teste com chave válida
- **WHEN** o usuário clica no botão de testar conexão com uma chave válida preenchida
- **THEN** o sistema envia uma requisição leve de verificação e exibe confirmação visual de conexão bem-sucedida

#### Scenario: Teste com chave inválida ou erro
- **WHEN** o usuário clica no botão de testar conexão e a API retorna erro
- **THEN** o sistema exibe mensagem descritiva do erro ocorrido sem persistir estado inconsistente

### Requirement: Posicionamento responsivo do widget de IA
O botão flutuante do assistente de IA DEVE respeitar a área da barra de navegação inferior em dispositivos móveis.

#### Scenario: Visualização em tela móvel
- **WHEN** o aplicativo é aberto em resolução móvel com a barra inferior ativa
- **THEN** o botão flutuante do assistente é posicionado acima da barra inferior para evitar sobreposição

