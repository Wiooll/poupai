# debt-tracking Specification

## Purpose
TBD - created by archiving change add-debts-tracking. Update Purpose after archive.
## Requirements
### Requirement: Cadastro de dívidas
O sistema SHALL permitir cadastrar, editar e excluir dívidas com descrição, credor, valor total, vencimento opcional, prioridade opcional, observação opcional, juros e parcelas informativos.

#### Scenario: Cadastro válido
- **WHEN** o usuário informar descrição, credor e valor total maior que zero e salvar
- **THEN** a dívida é criada com status `pendente`
- **AND** aparece na lista da aba "Dívidas"

#### Scenario: Dados inválidos
- **WHEN** o usuário tentar salvar sem descrição ou com valor total menor ou igual a zero
- **THEN** o sistema exibe uma mensagem de erro em pt-BR e não salva

#### Scenario: Exclusão de dívida
- **WHEN** o usuário confirmar a exclusão de uma dívida
- **THEN** a dívida, seus pagamentos e as despesas geradas por eles são removidos

### Requirement: Saldo restante e status
O sistema SHALL calcular o saldo restante como valor total menos a soma dos pagamentos e manter o status `pendente`, `parcial` ou `quitada`.

#### Scenario: Dívida sem pagamentos
- **WHEN** a dívida não tem pagamentos
- **THEN** o saldo restante é igual ao valor total e o status é `pendente`

#### Scenario: Pagamento parcial
- **WHEN** a soma dos pagamentos é maior que zero e menor que o valor total
- **THEN** o status é `parcial`

#### Scenario: Quitação
- **WHEN** a soma dos pagamentos é igual ao valor total
- **THEN** o status é `quitada` e o saldo restante é zero

#### Scenario: Dívida vencida
- **WHEN** a dívida não está quitada e a data de vencimento é anterior a hoje
- **THEN** a interface sinaliza a dívida como vencida
- **AND** o status gravado não muda

### Requirement: Pagamento de dívida com despesa
O sistema SHALL registrar cada pagamento no histórico da dívida e gerar uma transação de despesa descontada da conta escolhida.

#### Scenario: Pagamento parcial
- **WHEN** o usuário pagar um valor maior que zero e menor que o saldo restante, escolhendo uma conta
- **THEN** é criado um registro de pagamento com data, valor e conta
- **AND** é criada uma transação de despesa na categoria "Pagamento de Dívida" vinculada à conta
- **AND** o status da dívida passa a `parcial`

#### Scenario: Pagamento total
- **WHEN** o usuário pagar o valor igual ao saldo restante
- **THEN** o status da dívida passa a `quitada`

#### Scenario: Valor acima do saldo
- **WHEN** o usuário informar valor maior que o saldo restante
- **THEN** o sistema exibe erro em pt-BR e não registra o pagamento

#### Scenario: Conta não informada
- **WHEN** o usuário tentar pagar sem escolher uma conta
- **THEN** o sistema exibe erro em pt-BR e não registra o pagamento

#### Scenario: Falha durante o pagamento
- **WHEN** ocorrer erro ao gravar o pagamento
- **THEN** nenhuma transação, pagamento ou mudança de status é mantida

### Requirement: Histórico de abatimentos
O sistema SHALL exibir o histórico de pagamentos de cada dívida e permitir desfazer um pagamento.

#### Scenario: Consulta do histórico
- **WHEN** o usuário abrir os detalhes de uma dívida
- **THEN** vê a lista de pagamentos com data, valor e conta, do mais recente ao mais antigo

#### Scenario: Desfazer pagamento
- **WHEN** o usuário excluir um pagamento do histórico
- **THEN** o pagamento e a despesa vinculada são removidos
- **AND** o saldo restante e o status da dívida são recalculados

### Requirement: Total devido no Dashboard
O sistema SHALL exibir no Dashboard o total devido, somando o saldo restante das dívidas não quitadas.

#### Scenario: Existem dívidas em aberto
- **WHEN** há dívidas `pendente` ou `parcial`
- **THEN** o Dashboard mostra o card "Total devido" com a soma dos saldos restantes, em reais

#### Scenario: Sem dívidas em aberto
- **WHEN** não há dívidas em aberto
- **THEN** o card mostra R$ 0,00

### Requirement: Persistência e backup
O sistema SHALL persistir dívidas e pagamentos localmente e incluí-los no backup, mantendo compatibilidade com backups anteriores.

#### Scenario: Backup com dívidas
- **WHEN** o usuário exportar ou sincronizar um backup
- **THEN** o snapshot contém `debts` e `debtPayments`

#### Scenario: Restauração de backup antigo
- **WHEN** o usuário restaurar um backup sem `debts` e `debtPayments`
- **THEN** o backup é aceito e as dívidas ficam vazias

#### Scenario: Banco existente
- **WHEN** um usuário com dados abrir a nova versão
- **THEN** os dados atuais permanecem intactos e as novas tabelas são criadas vazias

