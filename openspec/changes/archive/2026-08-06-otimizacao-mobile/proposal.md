## Why

Atualmente, o aplicativo possui uma barra de navegação inferior (bottom navigation) em dispositivos móveis. No entanto, é necessária uma "otimização total", o que implica em melhorar a ergonomia, o tamanho dos botões (touch targets), o feedback visual (animações e indicadores de aba ativa) e o uso do espaço de tela, garantindo que a experiência no smartphone seja fluida e profissional, equiparando-se a aplicativos nativos.

## What Changes

- Redesenho completo da barra de navegação inferior (Bottom Navigation).
- Ajuste das margens de segurança (safe areas) para dispositivos iOS/Android.
- Otimização do tamanho de toque (Touch Targets) para garantir o mínimo de 48x48px recomendado por guias de acessibilidade.
- Implementação de animações suaves ao transitar entre as abas e ao focar no item ativo.
- Ocultação inteligente da barra de navegação ao realizar scroll para baixo (para maximizar a área de leitura) e reexibição ao fazer scroll para cima.

## Capabilities

### New Capabilities
*(Nenhuma nova funcionalidade raiz, focaremos na otimização de componentes já existentes).*

### Modified Capabilities
- `mobile-bottom-navigation`: Aprimoramento visual e comportamental (hide on scroll, safe areas, touch targets, animações).

## Impact

- **Layout/UI**: Forte modificação no componente de Layout (ou no componente específico do Bottom Navigation), adicionando lógica de escuta de scroll de janela (`window.addEventListener('scroll')`).
- **Acessibilidade**: Melhoria significativa, garantindo que botões possuam os tamanhos corretos para dispositivos de toque.
- **Performance**: É vital garantir que a lógica de "hide on scroll" utilize técnicas de otimização (debounce/throttle ou IntersectionObserver) para não causar engasgos (jank) na interface.
