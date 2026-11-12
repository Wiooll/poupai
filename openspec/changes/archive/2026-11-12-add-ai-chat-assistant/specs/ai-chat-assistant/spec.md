## ADDED Requirements

### Requirement: Botão flutuante do assistente
O sistema SHALL exibir um botão flutuante no canto inferior direito em todas as telas da aplicação.

#### Scenario: Visualização do botão
- **WHEN** o usuário acessa qualquer tela da aplicação
- **THEN** o botão flutuante com ícone de assistente/IA deve estar visível

### Requirement: Janela de chat conversacional
O sistema SHALL prover uma interface de conversa que permite o envio de comandos em linguagem natural para realizar ações ou fazer consultas.

#### Scenario: Abrir janela de chat
- **WHEN** o usuário clica no botão flutuante
- **THEN** a janela de conversa deve ser exibida e permitir a digitação

### Requirement: Integração e Confirmação de ações
O sistema SHALL identificar intenções de escrita e exibir uma prévia confirmável antes de aplicar mudanças no banco de dados.

#### Scenario: Confirmação de transação via chat
- **WHEN** o usuário digita "Gastei 50 no mercado hoje"
- **THEN** o sistema deve processar a intenção e exibir um card com os detalhes: descrição "mercado", valor 50, categoria detectada, e botão "Confirmar"

### Requirement: Respostas de consulta
O sistema SHALL permitir que o usuário faça perguntas sobre suas finanças e receba respostas claras.

#### Scenario: Consulta de gastos por categoria
- **WHEN** o usuário digita "Quanto gastei com lazer esse mês?"
- **THEN** o sistema deve exibir a resposta com o valor total calculado para a categoria "Lazer"
