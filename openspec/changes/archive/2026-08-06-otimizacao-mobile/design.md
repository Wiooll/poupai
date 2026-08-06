## Context

A navegação móvel atual funciona, mas pode oferecer uma experiência de usuário (UX) inferior quando comparada a aplicativos nativos, devido à falta de animações fluidas, espaço de toque subótimo e ocupação permanente do espaço inferior da tela, mesmo quando o usuário está imerso na leitura/rolagem de conteúdo longo (ex. lista de transações).

## Goals / Non-Goals

**Goals:**
- Melhorar a acessibilidade dos botões, definindo tamanhos e espaçamentos adequados (mínimo de 48px de área de toque interativa).
- Implementar a função "Hide on Scroll": esconder a barra de navegação suavemente ao rolar para baixo e reexibi-la ao rolar para cima.
- Suportar "Safe Area" garantindo que a barra de navegação não fique por baixo de barras indicadoras do sistema operacional no iOS/Android.
- Prover feedback visual avançado (micro-interações) ao trocar de aba (ex: ícone destacado ou mudança de cor com transição).

**Non-Goals:**
- Não iremos construir uma arquitetura PWA completa neste escopo, apenas refinar a navegação existente do DOM via Tailwind/React.

## Decisions

- **Ocultação baseada em Scroll:** Implementar um custom hook `useScrollDirection` que detecte a direção da rolagem e controle uma classe Tailwind (ex: `translate-y-full` vs `translate-y-0`) com `transition-transform duration-300 ease-in-out` aplicada na barra inferior.
- **Safe Area Insets:** Utilizar propriedades nativas do CSS como `padding-bottom: env(safe-area-inset-bottom)` dentro das classes utilitárias ou diretamente no style para respeitar o notch inferior de aparelhos modernos.
- **Touch Targets:** Garantir que as tags `<button>` ou `<a>` contenham padding suficiente para preencher pelo menos 48x48 pixels lógicos de área de toque.

## Risks / Trade-offs

- **Performance de Scroll:** Ouvintes de evento atrelados ao `scroll` de forma não otimizada podem degradar o framerate em smartphones de entrada.
  *Mitigação:* Usar controle de dependência e otimização para não disparar renderizações frequentes, alterando estado apenas quando houver efetiva mudança de direção do scroll. O uso de classes utilitárias (Tailwind) delegará a animação pesada para a GPU (via `transform`).
- **Problemas de Layout com Teclado:** Em telas curtas, se um teclado virtual subir, a barra inferior poderia tapar inputs.
  *Mitigação:* Garantir que a barra respeite `z-index` adequado e saia da frente em cenários de foco ou role livremente.
