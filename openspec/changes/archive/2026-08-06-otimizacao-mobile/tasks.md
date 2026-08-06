## 1. Implementação do Helper de Scroll

- [x] 1.1 Criar o custom hook `useScrollDirection` (ex. em `src/utils/` ou `src/hooks/`) para detectar a rolagem do usuário, retornando se o usuário está subindo ou descendo (`up` ou `down`).
- [x] 1.2 Otimizar o listener de scroll (adicionar debounce/throttle simples ou condicional) para não acionar renders inúteis.

## 2. Refatoração da Barra de Navegação

- [x] 2.1 Adicionar suporte a `env(safe-area-inset-bottom)` no container da barra móvel (em `Layout.tsx` ou respectivo componente).
- [x] 2.2 Atualizar as classes dos ícones/botões de navegação garantindo um padding que atinja ao menos `w-12 h-12` (48x48px) para melhor ergonomia de toque.
- [x] 2.3 Melhorar o feedback visual da aba ativa, usando transições Tailwind de cor/opacidade (`transition-colors duration-200`).

## 3. Lógica de Ocultar Barra (Hide on Scroll)

- [x] 3.1 Integrar o hook `useScrollDirection` no componente pai que hospeda a barra inferior.
- [x] 3.2 Atrelar uma classe dinâmica de transformação (ex: `translate-y-[150%]`) à barra inferior quando a direção do scroll for "para baixo".
- [x] 3.3 Garantir que a barra utilize classes de transição suaves (`transition-transform duration-300 ease-in-out`).

## 4. Validação e Testes Visuais

- [x] 4.1 Iniciar o servidor de desenvolvimento e testar no navegador a simulação de smartphone (DevTools).
- [x] 4.2 Validar que rolar a lista de transações para baixo oculta a barra e ao subir, a barra reaparece.
- [x] 4.3 Validar que o tamanho de toque (botões da barra inferior) ficou responsivo e amigável.
