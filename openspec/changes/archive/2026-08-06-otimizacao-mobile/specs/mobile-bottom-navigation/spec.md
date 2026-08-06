## MODIFIED Requirements

### Requirement: Exibir Navegação Inferior Otimizada
O sistema SHALL renderizar um menu de navegação inferior estilo "Bottom Action Bar" sempre que a largura da janela for de dispositivo móvel. A barra SHALL respeitar as safe areas dos dispositivos móveis, e garantir áreas mínimas de toque de 48x48px.

#### Scenario: Visualizando o aplicativo em resoluções mobile
- **WHEN** o usuário abre a aplicação num smartphone (ou viewport com quebra `< md` no Tailwind)
- **THEN** a barra inferior deve emergir e estar fixada à base da tela (bottom-0)
- **AND** os elementos clicáveis devem ter área interativa de no mínimo 48x48 pixels
- **AND** o container da barra deve ter preenchimento (padding) adicional baseando-se no `env(safe-area-inset-bottom)` do sistema operacional

## ADDED Requirements

### Requirement: Barra inferior auto-ocultável baseada em rolagem
A barra inferior mobile SHALL ser sensível à direção da rolagem da janela de visualização do aplicativo para maximizar a visibilidade de conteúdo.

#### Scenario: Ocultar barra ao rolar a página para baixo
- **WHEN** o usuário faz scroll vertical para baixo no conteúdo principal
- **THEN** a barra de navegação inferior SHALL deslizar para fora da tela utilizando transição suave

#### Scenario: Reexibir barra ao rolar a página para cima
- **WHEN** o usuário faz scroll vertical para cima no conteúdo principal
- **THEN** a barra de navegação inferior SHALL deslizar de volta para a tela e ficar fixada na base
