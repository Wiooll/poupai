# PoupAi | Seu Dashboard Financeiro

> Versão atual: **4.11.0**. O app foi renomeado de FinDash para PoupAi. Por compatibilidade com dados e backups já existentes, os identificadores internos continuam com o prefixo `findash` (banco `FinDashDB`, chaves `findash_*`/`findash:*` do navegador e o arquivo `findash-backup.json` no Google Drive). Backups antigos continuam sendo restaurados normalmente.

O **PoupAi** é um dashboard moderno, interativo e responsivo para controle de despesas e finanças pessoais.

## Funcionalidades principais

- Dashboard com resumo de saldo, receitas, despesas e economia mensal.
- Assistente financeiro conversacional com Inteligência Artificial (OpenAI GPT-4o ou Google Gemini) com ações automáticas de lançamentos e consultas.
- Gráficos de fluxo de caixa dos últimos 12 meses e despesas por categoria.
- Gestão de transações com filtros, categorias e recorrências.
- Controle de contas, cartões de crédito e faturas.
- Módulo de empréstimos com acompanhamento de status.
- Tela de gerenciamento com suporte, backup manual e documentos legais.
- Seção de apoio ao projeto com cópia da chave Pix para contribuição opcional.
- Seção de app parceiro na aba Gerenciamento com CTA externo seguro.
- Notificações de novidades por versão e aba de **Atualizações**.

## Tecnologias

- React + TypeScript
- Vite
- Tailwind CSS
- Recharts
- Dexie.js (IndexedDB)

## Persistência de dados

O app opera no modelo **Offline-First**, utilizando o armazenamento local do navegador através do **IndexedDB (via Dexie.js)**. Os dados nunca saem do seu dispositivo, garantindo total privacidade e velocidade.

## Como executar localmente

Pré-requisitos: Node.js (recomendado v18+).

1. Acesse a pasta do projeto:

```bash
cd dash_gastos
```

2. Instale as dependências:

```bash
npm install
```

3. Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

4. Acesse no navegador: `http://localhost:5173`

## Configuração opcional de apoio via Pix

Para habilitar a chave Pix no card de apoio:

1. Configure no `.env.local`:

```bash
VITE_SUPPORT_PIX_KEY=sua-chave-pix-aqui
```

2. Reinicie o app (`npm run dev`) para carregar a variável.

## Configuração opcional de app parceiro

Para habilitar o card de divulgação de app parceiro na aba **Gerenciamento**:

1. Configure no `.env.local`:

```bash
VITE_PARTNER_APP_NAME=Nome do app parceiro
VITE_PARTNER_APP_DESCRIPTION=Descrição curta do parceiro
VITE_PARTNER_APP_URL=https://parceiro.exemplo.com
VITE_PARTNER_APP_CTA_LABEL=Conhecer app parceiro
```

2. Campos obrigatórios para exibição: `VITE_PARTNER_APP_NAME` e `VITE_PARTNER_APP_URL`.
3. O link aceita apenas URLs `http` ou `https`.
4. Reinicie o app (`npm run dev`) após atualizar variáveis de ambiente.

## Backup automático no Google Drive (opcional)

O recurso vem **desativado por padrão**. Sem configuração, o app não carrega scripts nem faz requisições ao Google.

1. No Google Cloud, crie um OAuth Client ID do tipo **Aplicativo da Web**, habilite a **Google Drive API** e inclua a origem do app (ex.: `http://localhost:5173`) em "Origens JavaScript autorizadas".
2. Configure no `.env.local`:

```bash
VITE_DRIVE_SYNC_ENABLED=true
VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
```

3. Reinicie o app e use o card **Backup automático no Google Drive** em **Gerenciamento**.

Como funciona:

- Escopo mínimo `drive.appdata`: o app só acessa o próprio arquivo oculto (`findash-backup.json`).
- O token de acesso fica apenas em memória. Só um indicador de "já autorizado" (sem token) é guardado no navegador.
- Após recarregar, o app tenta reconectar em silêncio, depois que os dados locais carregam. Se o Google ou o navegador exigirem interação, use **Reconectar ao Google Drive**.
- A tela de consentimento aparece apenas na primeira autorização.
- Cada alteração agenda o envio do backup (5 s de debounce, com até 2 novas tentativas em falhas de rede).
- Conflito: vence o backup com data mais recente; em empate, o local. Dispositivo sem dados aceita o backup do Drive.
- Restauração automática é opcional. Se o Drive estiver mais recente e ela estiver desligada, o envio fica pausado até você restaurar ou usar **Sincronizar agora**.
- Falhas no Drive nunca bloqueiam o uso local.

Arquivos principais: `src/services/driveBackupService.ts`, `src/services/localChangeTracker.ts`, `src/utils/backupConflict.ts`, `src/context/DriveSyncContext.tsx` e `src/components/DriveSyncCard.tsx`.

## Atualizações recentes

### Sprint 4.10.1 - Reconexão do Drive

- Consentimento do Google solicitado só na primeira autorização.
- Reconexão silenciosa ao abrir o app, após o carregamento do banco local.
- Botão **Reconectar ao Google Drive** quando for necessária interação.

### Sprint 4.10.0 - Backup Automático no Google Drive

- Novo card **Backup automático no Google Drive** em **Gerenciamento**, opcional e desativado por padrão.
- Sincronização automática com debounce, retry leve, status e data da última sincronização.
- Restauração automática opcional com regra "mais recente vence".
- Limpeza de resquícios textuais de Firebase/Firestore.

### Sprint 4.9.1 - Correção de Lançamentos pelo Assistente de IA

- Lançamentos criados pela IA passam por validação antes do preview e do salvamento: data (`YYYY-MM-DD`), tipo, valor, forma de pagamento, categoria, conta e cartão.
- Propostas sem descrição, com valor inválido ou sem tipo de receita/despesa são recusadas com orientação em português.
- "Hoje" usa o fuso local do usuário; contas e cartões são enviados à IA com seus identificadores.
- Mensagem amigável quando o modelo de IA está com alta demanda.

### Sprint 4.9.0 - Listagem e Seleção de Modelos de IA

- Ao informar a chave de API, o app consulta o provedor e lista os modelos disponíveis e compatíveis com o assistente (clique em **Carregar modelos** ou saia do campo da chave).
- OpenAI: lista apenas modelos de chat (`gpt-*`), sem embeddings, áudio, imagem ou moderação. Gemini: apenas modelos com suporte a `generateContent`.
- O modelo escolhido é salvo em **Gerenciamento > Configurações de IA** e usado no teste de conexão e no chat. Sem escolha, vale o padrão do provedor.
- Se o modelo salvo não estiver mais disponível para a chave, o app avisa e não troca de modelo automaticamente.
- Falhas na listagem (chave inválida, rede ou CORS) exibem mensagem clara e não impedem salvar a chave.

### Sprint 4.8.4 - Link para Obter Chave de API

- Novo link **Obter chave de API** em **Gerenciamento > Configurações de IA**.
- O destino acompanha o provedor selecionado: OpenAI (`platform.openai.com/api-keys`) ou Google Gemini (`aistudio.google.com/app/apikey`).
- Abertura em nova aba com `rel="noopener noreferrer"`.

### Sprint 4.8.3 - Resiliência e Diagnóstico do Assistente de IA

- **Resiliência de Modelos**: Suporte nativo aos modelos oficiais do Google Gemini (`gemini-2.0-flash` e `gemini-1.5-flash`) com fallback automático caso um modelo esteja indisponível na região ou chave do usuário.
- **Teste de Conexão em Tempo Real**: Novo botão de validação na aba **Gerenciamento > Configurações de IA** que verifica a validade da chave e do provedor antes do uso.
- **Sanitização de JSON**: Extração tolerante de respostas mesmo quando envolvidas em blocos de código markdown.
- **Mensagens Amigáveis**: Mapeamento descritivo de erros HTTP (400, 401, 403, 404, 429) em português brasileiro.
- **Ajuste Mobile**: Posicionamento flutuante corrigido para evitar sobreposição da barra de navegação inferior em dispositivos móveis.

### Sprint 4.8.0 - Offline-First e Local Database

- **Privacidade total**: Remoção completa de dependências na nuvem (Firebase/Firestore e Auth).
- **Offline-First**: Todo o banco de dados e as funcionalidades operam offline de forma nativa utilizando o armazenamento do próprio navegador com **Dexie.js (IndexedDB)**.
- **Rápida velocidade**: Leituras reativas e gravação instantânea de transações ocorrem localmente, sem atrasos de rede.

### Sprint 4.7.0 - Metas Financeiras e Otimização de Menu

- Adição da nova funcionalidade de **Metas**, permitindo cadastro e acompanhamento de progresso de objetivos financeiros.
- Inclusão da opção de expandir e recolher o menu lateral (desktop) para melhorar a usabilidade.
- Otimização do menu e barra de navegação com a remoção de abas não utilizadas (Empréstimos).

### Sprint 4.6.0 - Espaço de App Parceiro

- Novo card **App Parceiro** na aba **Gerenciamento**.
- Exibição condicional por configuração de ambiente (nome + URL válidos).
- Link externo com abertura segura em nova aba.

### Sprint 4.5.3 - Persistência do Mês em Transações

- O filtro de mês da aba **Transações** agora permanece salvo ao sair e voltar para a aba.
- A tela restaura automaticamente o último período selecionado no seletor existente.
- Quando não há valor salvo válido, o sistema aplica fallback para o mês atual.

### Sprint 4.5.2 - Qualidade de Texto pt-BR

- Correção de ortografia e acentuação em textos da interface.
- Nova validação automática para bloquear textos com erro de pt-BR/encoding.

### Sprint 4.5.1 - Apoio ao Projeto via Pix

- Nova seção **Apoie o FinDash** na aba **Gerenciamento**.
- Botão para copiar a chave Pix com feedback de sucesso/erro.
- Chave Pix configurável por ambiente com `VITE_SUPPORT_PIX_KEY`.

### Sprint 4.5.0 - Atualizações de Versão e Navegação Mobile

- Melhoria no menu inferior mobile com arraste horizontal mais fluido para acessar todas as abas.
- Nova aba **Atualizações** com histórico de versões, destaques e melhorias.
- Notificação de novidades por versão para direcionar o usuário à aba de atualizações.
- Ao abrir a aba de atualizações, a versão atual é marcada como visualizada localmente.

### Sprint 4.4.1 - Gerenciamento, Legal e Backup Manual

- A aba **Gerenciamento** concentra suporte, backup manual e documentos legais.
- Envio de sugestão e reporte de bug via `mailto` com assunto padronizado.
- Exportação e importação de backup em **JSON** com validação de estrutura.

### Sprint 4.4.0 - Página de Gerenciamento

- Nova aba **Gerenciamento** para concentrar recursos de suporte e manutenção.
- Ações rápidas para **Enviar sugestão** e **Reportar bug**.
- Área de **backup manual** com integração de uso junto ao Google Drive.
- Seção de documentos legais (Termos de Uso, Privacidade e Cookies).

## Qualidade de Texto (pt-BR)

Para evitar regressões de encoding (ex.: acentuação corrompida ou símbolos inválidos), execute:

```bash
npm run check:text-encoding
```

Para validar ortografia/acentuação em textos visíveis da interface (pt-BR), execute:

```bash
npm run check:text-ptbr-ui
```
