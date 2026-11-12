## Context

Atualmente o aplicativo `dash_gastos` possui formulários manuais para gerenciamento de transações, categorias, contas e faturas, armazenando dados localmente através do Dexie DB (`FinanceContext.tsx`). Para modernizar e agilizar a usabilidade sem violar a privacidade e as regras de segurança do projeto, vamos introduzir um assistente de IA conversacional alimentado por chave de API fornecida pelo próprio usuário (*BYOK - Bring Your Own Key*).

## Goals / Non-Goals

**Goals:**
- Prover uma interface de chat flutuante adaptada tanto para telas de desktop quanto dispositivos móveis.
- Permitir configuração local e segura da chave de API no `AppConfig` (`Management.tsx`).
- Injetar contexto das categorias, contas e cartões no prompt da IA para identificação precisa.
- Implementar fluxo de ação com card interativo de confirmação/edição antes de aplicar inserções/alterações no banco local.
- Permitir consultas ao resumo financeiro atual em linguagem natural.

**Non-Goals:**
- Não armazenar a chave da API em servidores externos ou variáveis de ambiente públicas.
- Não executar modificações diretas no banco de dados sem a confirmação explícita do usuário.
- Não substituir as telas tradicionais de transações, mas sim complementá-las.

## Decisions

### 1. Modelo *Bring Your Own Key* (BYOK) para IA
- **Escolha**: O próprio usuário insere sua chave da API (ex: OpenAI / Gemini) nas configurações do app.
- **Alternativas Consideradas**: Backend intermediário centralizado (descartado para evitar custos de infraestrutura e vazamento de chaves).
- **Justificativa**: Preserva a arquitetura offline/local-first do app e garante custo zero para a aplicação.

### 2. Widget Flutuante no `Layout.tsx`
- **Escolha**: Adicionar o `AiChatWidget` no `Layout.tsx`, posicionado no canto inferior direito, ajustando o z-index e o padding inferior em telas mobile para coexistir com a `MobileBottomNav`.
- **Alternativas Consideradas**: Adicionar apenas como uma aba no menu lateral (menos acessível de qualquer ponto da aplicação).

### 3. Confirmação Obrigatória em Ações de Escrita (*Human-in-the-loop*)
- **Escolha**: Quando a IA interpretar uma ação de adição ou alteração, ela retorna um payload estruturado (`ACTION_PROPOSAL`). O chat renderiza um card com os campos pré-preenchidos e botões "Confirmar" ou "Cancelar".
- **Justificativa**: Evita cadastros errôneos decorrentes de alucinações ou interpretações incorretas da IA.

## Risks / Trade-offs

- **[Risco] Chave de API inválida ou sem saldo na conta da IA**
  → *Mitigação*: Tratar erros HTTP de forma amigável no chat, exibindo mensagens claras em PT-BR e link para a tela de configurações.
- **[Risco] Sobreposição com botões ou menus na interface mobile**
  → *Mitigação*: Aplicar regras CSS responsivas com `bottom-20` no mobile (acima do `MobileBottomNav`) e `bottom-6` no desktop.
- **[Risco] Vazamento de dados em logs**
  → *Mitigação*: Nunca registrar a chave de API em logs (`console.log`) e manter a chave mascarada na interface.
