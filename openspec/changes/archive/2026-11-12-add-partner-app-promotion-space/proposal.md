## Why

O produto ja possui uma aba de Gerenciamento com secoes institucionais e de apoio. Falta um espaco padronizado para divulgacao de app parceiro, com configuracao simples por ambiente e seguranca basica de link externo.

## What Changes

- Adicionar um novo bloco "App Parceiro" na aba **Gerenciamento**.
- Definir exibicao configuravel por variaveis de ambiente, sem hardcode de parceiro no codigo.
- Exibir o bloco apenas quando a configuracao minima estiver valida.
- Garantir abertura segura de link externo e texto transparente de conteudo parceiro.
- Cobrir regra de exibicao/ocultacao com testes objetivos.

## Capabilities

### New Capabilities
- `partner-app-promotion-space`: espaco de divulgacao de app parceiro no hub de Gerenciamento, com CTA externo seguro e conteudo configuravel.

### Modified Capabilities
- `management-hub-page`: incluir secao de divulgacao de parceiro no hub existente, sem quebrar secoes atuais.

## Impact

- Interface: novo card "App Parceiro" no Gerenciamento com titulo, descricao e CTA.
- Configuracao: novas variaveis de ambiente para nome, descricao, URL e rotulo do CTA.
- Seguranca: validacao basica de URL e links externos com protecao de navegacao.
- Qualidade: testes para renderizacao condicional e comportamento de fallback.
