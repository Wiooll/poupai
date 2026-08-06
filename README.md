# FinDash | Seu Dashboard Financeiro

O **FinDash** é um dashboard moderno, interativo e responsivo para controle de despesas e finanças pessoais.

## Funcionalidades principais

- Dashboard com resumo de saldo, receitas, despesas e economia mensal.
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

## Atualizações recentes

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
