## Context

O assistente financeiro de IA no FinDash foi desenvolvido para processar linguagem natural via chamadas de API (OpenAI ou Google Gemini) disparadas diretamente do frontend com as credenciais salvas pelo usuário no navegador.
Recentemente, a Google atualizou o ciclo de vida dos modelos na API Generative Language e ajustes manuais anteriores inseriram identificadores não padronizados (`gemini-3.8-flash` e `gemini-2.5-flash`), resultando em falhas 404/400. Além disso, respostas em formato JSON frequentemente vêm envelopadas em blocos de markdown, quebrando o parser nativo e impedindo ações no app. Usuários também carecem de uma forma simples de testar a chave antes de usar o chat.

## Goals / Non-Goals

**Goals:**
- Garantir que as chamadas ao Google Gemini utilizem modelos estáveis (`gemini-2.0-flash` como padrão moderno, com fallback para `gemini-1.5-flash`), minimizando risco de descontinuação imprevista.
- Implementar mecanismo de extração de JSON tolerante a falhas (sanitização de ````json ... ```` e caracteres espúrios).
- Adicionar função e botão de "Testar Conexão" na tela de Gerenciamento (`Management.tsx`) com feedback imediato ao usuário.
- Tratar erros de requisição de forma granular (chave inválida, cota esgotada, modelo indisponível, falha de rede/CORS).
- Corrigir o posicionamento responsivo do widget de IA no mobile em relação à `MobileBottomNav`.

**Non-Goals:**
- Não criar backend intermediário para proxy de IA neste momento (mantém a arquitetura client-side orientada a privacidade com chave local).
- Não alterar as regras de negócio de lançamento de transações (`ACTION_PROPOSAL`).
- Não incluir modelos locais (como WebLLM/Ollama) neste ciclo.

## Decisions

### 1. Modelo padrão e lista de fallback para Google Gemini
- **Decisão:** Configurar `gemini-2.0-flash` como modelo preferencial e manter `gemini-1.5-flash` como fallback automático em caso de erro 404.
- **Alternativas consideradas:**
  - *Hardcode de apenas um modelo novo:* Arriscado, pois alterações na API do Google podem quebrar novamente sem aviso.
  - *Obrigar o usuário a digitar o nome do modelo:* Ruim para a usabilidade de usuários leigos.

### 2. Sanitizador robusto de JSON com regex
- **Decisão:** Criar uma função utilitária `extractJsonFromText(rawText: string)` que remove blocos de código markdown (` ```json` ou ` ``` `) e busca o primeiro `{` até o último `}` balanceado antes de chamar `JSON.parse`.
- **Alternativas consideradas:**
  - *Confiar apenas no response_format da API:* Modelos do Gemini em certas versões ainda podem emitir markdown ou falhar na restrição estrita.

### 3. Função de verificação `testAIConnection`
- **Decisão:** Expor uma função leve que envia um prompt curto (ex: "ping" ou "responda OK") para validar se a chave é aceita e o endpoint responde status 200.
- **Alternativas consideradas:**
  - *Apenas validar formato regex da chave:* Não detecta se a chave foi revogada, se está sem cota ou se o modelo está liberado para ela.

### 4. Ajuste responsivo de posicionamento
- **Decisão:** Alterar a classe do container flutuante no mobile para `bottom-20 md:bottom-8`, garantindo que não colida com a barra inferior de navegação móvel de 64px.

## Risks / Trade-offs

- **[CORS em navegadores com APIs de IA]** → O Google Generative Language suporta CORS para chaves de API do Google AI Studio; mensagens de erro detalhadas alertarão se a requisição for bloqueada pelo navegador.
- **[Latência de fallback]** → Caso o modelo primário retorne 404, uma segunda chamada levará tempo adicional, mas evitará a interrupção da experiência do usuário com feedback de carregamento.

