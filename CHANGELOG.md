## [4.9.1] - 2026-11-12

### Corrigido
- Lançamentos feitos pelo Assistente de IA não apareciam em Transações: os dados agora são validados e normalizados antes de salvar.
- Data de "hoje" do assistente passa a usar o fuso local em vez de UTC.
- Mensagem amigável para indisponibilidade temporária (alta demanda) do modelo de IA.

### Alterado
- Contas e cartões passam a ser enviados ao assistente com seus identificadores.
- Versão da aplicação atualizada para `4.9.1`.

## [4.9.0] - 2026-11-12

### Adicionado
- Listagem dos modelos de IA disponíveis e compatíveis com a chave informada (OpenAI e Google Gemini).
- Seleção do modelo de IA em **Gerenciamento > Configurações de IA**, salvo no campo `aiModel`.

### Alterado
- Teste de conexão e chat passam a usar o modelo escolhido; sem escolha, mantém o modelo padrão do provedor.
- Versão da aplicação atualizada para `4.9.0`.

## [4.8.4] - 2026-11-12

### Adicionado
- Link **Obter chave de API** nas Configurações de IA, que acompanha o provedor selecionado (OpenAI ou Google Gemini).

### Alterado
- Versão da aplicação atualizada para `4.8.4`.

## [4.6.0] - 2026-04-30

### Adicionado
- Novo card **App Parceiro** na aba Gerenciamento para divulgação de parceiros.
- Configuração por variáveis de ambiente para nome, descrição, URL e texto do CTA.
- Exibição transparente de conteúdo parceiro na interface.

### Alterado
- Validação de URL (`http`/`https`) para renderizar o card parceiro com segurança.
- Versão da aplicação atualizada para `4.6.0`.

## [4.5.2] - 2026-04-30

### Corrigido
- Ortografia e acentuação de textos exibidos na interface (pt-BR).
- Mensagens da aba Gerenciamento e histórico de Atualizações com encoding normalizado.

### Adicionado
- Script `check:text-ptbr-ui` para validar textos da interface e bloquear termos comuns sem acento.
- Execução automática das validações de texto (`check:text-encoding` e `check:text-ptbr-ui`) no fluxo de `npm test`.

## [4.5.1] - 2026-04-30

### Adicionado
- Nova secao **Apoie o FinDash** na aba Gerenciamento para colaboracao via Pix.
- Botao para copiar a chave Pix com mensagem de sucesso/erro ao usuario.

### Alterado
- Chave Pix lida por variavel de ambiente (`VITE_SUPPORT_PIX_KEY`) para configuracao por ambiente.
- Versao da aplicacao atualizada para 4.5.1.

## [4.4.0] - 2026-04-30

### Adicionado
- Nova aba **Gerenciamento** no menu lateral e na navegacao mobile.
- Hub central para os novos recursos de suporte e governanca:
  - envio de sugestoes via mailto para suporte.listae@gmail.com;
  - reporte de bugs via mailto com assunto padronizado;
  - secao de documentos legais (Termos de Uso, Privacidade e Cookies);
  - secao informativa de backup manual (localStorage + Google Drive).

### Alterado
- Versao da aplicacao atualizada para 4.4.0.
## [4.1.0] - 2026-04-17

### Adicionado
- Autenticacao com Firebase Auth via Google (popup).
- Isolamento de dados por usuario no Firestore com estrutura `users/{uid}/...`.
- Importacao de transacoes via CSV com validacao por linha e feedback de erro.
- Exportacao de transacoes em CSV, Excel (`.xls`) e PDF, nos modos resumo e detalhado.
- Regras de seguranca em `firestore.rules` para bloquear acesso cruzado entre usuarios.
- Testes unitarios para calculos financeiros criticos em `financialCalculations`.
- Testes de integracao para CRUD de transacoes/categorias e isolamento por usuario.

### Alterado
- Contexto financeiro adaptado para persistir e consultar dados no escopo do usuario autenticado.
- Validacoes de formulario e mensagens de erro revisadas nas telas de transacoes e categorias.
- Versao do aplicativo exibida na interface e atualizada para `4.1.0`.
O formato segue uma adaptação de [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e [SemVer](https://semver.org/lang/pt-BR/).

## [2.1.0] - 2026-04-15

### Adicionado
- Projeção de fim de mês no Dashboard com receita prevista, despesa prevista, saldo previsto, média diária e nível de confiança.
- Comparação do mês atual vs mês anterior por categoria com variação absoluta e percentual.
- Motor de insights automáticos para aumento e redução de gastos por categoria.
- Detecção simples de anomalias de despesa por categoria com histórico mínimo e limiar determinístico.
- Nova aba `Insights` com histórico cronológico de alertas, resumo por tipo e filtro.
- Tipos e utilitários dedicados para análise financeira em `src/types.ts` e `src/utils/financialInsights.ts`.
- Testes unitários para projeção, comparativo, insights e anomalias com `vitest`.

### Alterado
- Navegação principal expandida para incluir a aba `Insights`.
- Dashboard atualizado para exibir preview de insights recentes e tabela de comparação entre meses.

## [2.0.1] - 2026-04-14

### Corrigido
- Limite do cartão em compras parceladas agora considera todo o valor ainda não quitado, inclusive parcelas futuras.
- Parcelas pertencentes a competências de fatura marcadas como `paga` não comprometem mais o limite disponível.

## [2.0.0] - 2026-04-14

### Adicionado
- **Módulo de Contas/Carteiras**: suporte a contas do tipo corrente, poupança, dinheiro e investimento, com saldo calculado em tempo real a partir das transações vinculadas.
- **Transferência entre Contas**: criação de duas transações do tipo `transferencia` (saída e entrada) que atualizam automaticamente os saldos das contas sem distorcer receitas/despesas.
- **Cartão de Crédito**: cadastro de cartões com limite, dia de fechamento, dia de vencimento e conta de débito vinculada.
- **Sistema de Faturas**: cálculo automático do período de competência de cada fatura com base nas regras do cartão (fechamento e vencimento).
- **Parcelamento de Compras**: suporte a compras parceladas que geram N transações individuais agrupadas por `parcelaGrupoId`, distribuídas nos meses seguintes.
- **Resumo de Faturas no Dashboard**: card de "Faturas em Aberto", saldo real (descontando faturas), alerta de próximo vencimento e mini-lista de faturas por cartão com barra de progresso e status.
- **Pagar Fatura**: botão para marcar fatura como paga e registrar a saída na conta de débito vinculada.
- **Coleções Firestore**: `contas`, `cartoesCredito` e `faturaStatus`.
- **Navegação expandida**: novas abas "Contas" e "Cartões" no menu lateral e mobile.

### Alterado
- Transações podem agora ser vinculadas a uma conta (`contaId`) ou cartão de crédito (`cartaoId`).
- TransactionsTable suporta seleção de conta/cartão por método de pagamento e parcelamento inline.
- Dashboard ignora transferências nos totais de receita/despesa para evitar dupla contagem.
- Filtro de transações inclui a opção "Transferências".

## [1.0.0] - 2026-04-13

### Adicionado
- Layout responsivo para desktop e mobile.
- Integração com Firebase/Firestore para persistência e sincronização em tempo real.
- Gerenciamento global de estado financeiro via contexto da aplicação.
- Ajustes de estrutura para variáveis de ambiente (`.env.example` e `.env.local`).

### Alterado
- Nome do pacote alterado de `dash_gastos` para `findash`.
- Atualizacao da documentacao no `README.md` com recursos e instrucoes do projeto.

## [0.0.0] - 2026-04-11

### Adicionado
- Inicialização do projeto com React + TypeScript + Vite.
- Configuração de Tailwind CSS e PostCSS.
- Estrutura inicial do dashboard financeiro com componentes principais.
- Configuração de build/lint e arquivos base do projeto.

[1.0.0]: https://github.com/Wiooll/Findash/releases/tag/v1.0.0

