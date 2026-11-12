## ADDED Requirements

### Requirement: Normalizar lançamentos propostos pela IA
O sistema SHALL validar e normalizar os dados de um lançamento proposto pela IA antes de exibir a confirmação e antes de salvar.

#### Scenario: Tipo e forma de pagamento fora do padrão
- **WHEN** a IA retorna `tipo` "Despesa" e `formaPagamento` "pix"
- **THEN** o sistema salva `tipo` "despesa" e `formaPagamento` "PIX"

#### Scenario: Valor em texto
- **WHEN** a IA retorna `valor` "12,50"
- **THEN** o sistema salva o valor numérico 12.5

#### Scenario: Data inválida ou ausente
- **WHEN** a IA retorna `data` ausente ou fora do formato `YYYY-MM-DD`
- **THEN** o sistema usa a data local de hoje

#### Scenario: Categoria com grafia diferente
- **WHEN** a IA retorna a categoria "alimentacao" e existe "Alimentação"
- **THEN** o sistema usa o nome da categoria existente

#### Scenario: Conta ou cartão inexistente
- **WHEN** a IA retorna `contaId` ou `cartaoId` que não existe
- **THEN** o sistema omite o campo

#### Scenario: Campos indevidos
- **WHEN** a IA retorna `id` ou `userId`
- **THEN** o sistema não grava esses campos no novo lançamento

### Requirement: Rejeitar propostas inválidas
O sistema SHALL recusar lançamentos sem descrição ou com valor inválido, informando o motivo em português do Brasil.

#### Scenario: Valor zero ou negativo
- **WHEN** a proposta tem valor menor ou igual a zero
- **THEN** o sistema não exibe confirmação e pede ao usuário que informe um valor válido

### Requirement: Data local como referência
O sistema SHALL usar a data local do usuário como "hoje" no prompt e como padrão.

#### Scenario: Lançamento à noite
- **WHEN** o usuário cria um lançamento às 22h no fuso do Brasil
- **THEN** a data padrão é o dia local, não o dia UTC
