## Context

A aba de Gerenciamento centraliza funcionalidades institucionais (suporte, backup, documentos legais e apoio). A divulgacao de app parceiro deve seguir o mesmo padrao visual, sem acoplamento a um parceiro fixo e sem comprometer seguranca ou manutencao.

## Goals / Non-Goals

**Goals:**
- Incluir secao "App Parceiro" no Gerenciamento mantendo padrao atual.
- Permitir configuracao por ambiente para evitar alteracoes de codigo a cada troca de parceiro.
- Exibir a secao apenas quando dados obrigatorios estiverem presentes e validos.
- Garantir navegacao externa segura e transparente ao usuario.

**Non-Goals:**
- Sistema de rotacao de multiplos parceiros nesta fase.
- Painel administrativo para cadastro dinamico de parceiros.
- Telemetria/trackeamento avancado de cliques nesta entrega.

## Decisions

1. Configuracao por variaveis de ambiente
- Decisao: usar variaveis para `nome`, `descricao`, `url` e `cta` do parceiro.
- Racional: reduz custo de manutencao e evita hardcode sensivel a mudancas comerciais.

2. Renderizacao condicional estrita
- Decisao: renderizar card apenas com URL valida (`http` ou `https`) e nome preenchido.
- Racional: evita bloco quebrado e minimiza risco de link malformado.

3. Integracao no Gerenciamento existente
- Decisao: incluir o bloco dentro da grade atual de cards da pagina `Management`.
- Racional: aproveita descoberta ja consolidada e preserva navegacao.

4. Transparencia de conteudo parceiro
- Decisao: incluir copy curta identificando o card como divulgacao/parceria.
- Racional: melhora confianca e clareza para o usuario final.

## Data Model

Configuracao proposta (env):

- `VITE_PARTNER_APP_NAME` (obrigatoria para exibir)
- `VITE_PARTNER_APP_DESCRIPTION` (opcional)
- `VITE_PARTNER_APP_URL` (obrigatoria para exibir)
- `VITE_PARTNER_APP_CTA_LABEL` (opcional, fallback padrao)

Regra de exibicao:
- Exibir somente quando `NAME` e `URL` estiverem preenchidos e `URL` for valida.
- Se `DESCRIPTION` ausente, usar descricao padrao curta.
- Se `CTA_LABEL` ausente, usar "Conhecer app parceiro".

## Error Handling

- URL invalida: nao renderizar card e manter tela funcional sem erro visual.
- Dados parciais: aplicar fallback para campos opcionais; ocultar quando faltarem obrigatorios.
- Tentativa de configuracao com protocolo nao suportado: ignorar exibicao.

## Risks / Trade-offs

- [Risk] Falha de configuracao em ambiente pode ocultar o card.
  - Mitigacao: documentar obrigatoriedade no README e validar no teste.
- [Trade-off] Sem telemetria de clique inicialmente.
  - Justificativa: manter escopo enxuto e seguro na primeira versao.

## Open Questions

- O texto de transparencia deve usar "Parceiro" ou "Publicidade" como termo oficial do produto?
- Havera limite de caracteres para titulo e descricao do parceiro?
