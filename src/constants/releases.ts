export interface ReleaseNote {
  version: string;
  date: string;
  highlights: string[];
  details?: string[];
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '4.8.4',
    date: '2026-11-12',
    highlights: [
      'Novo link "Obter chave de API" nas Configurações de IA, na aba Gerenciamento.',
    ],
    details: [
      'O link muda conforme o provedor selecionado (OpenAI ou Google Gemini) e abre em nova aba.',
    ],
  },
  {
    version: '4.8.3',
    date: '2026-10-31',
    highlights: [
      'Resiliência aprimorada no Assistente de IA com suporte oficial a Gemini 2.0 Flash e 1.5 Flash.',
      'Novo botão de teste de conexão com a API de IA na aba Gerenciamento.',
      'Extração segura de respostas JSON e mensagens de erro amigáveis.',
      'Ajuste no posicionamento do widget flutuante em dispositivos móveis.',
    ],
    details: [
      'Adicionado fallback automático entre modelos oficiais do Gemini para evitar falhas por modelo indisponível.',
      'Sanitização avançada de blocos markdown para garantir o correto processamento de lançamentos e consultas.',
      'Validação prévia da chave e diagnóstico em tempo real antes de abrir o chat.',
    ],
  },
  {
    version: '4.8.2',
    date: '2026-10-29',
    highlights: [
      'Assistente de IA atualizado para o modelo Gemini 3.8 Flash.',
    ],
    details: [
      'O modelo gemini-2.5-flash foi substituído pelo gemini-3.8-flash, corrigindo erros de chamada à API após nova descontinuação.',
      'O endpoint REST da API do Gemini também foi atualizado para o novo identificador de modelo.',
    ],
  },
  {
    version: '4.8.1',
    date: '2026-10-29',
    highlights: [
      'Assistente de IA atualizado para o modelo Gemini 2.5 Flash.',
    ],
    details: [
      'O modelo gemini-1.5-flash foi substituído pelo gemini-2.5-flash, corrigindo erros de chamada à API após descontinuação do modelo anterior.',
      'O endpoint REST da API do Gemini também foi atualizado para refletir o novo identificador de modelo.',
    ],
  },
  {
    version: '4.6.0',
    date: '2026-04-30',
    highlights: [
      'Nova seção "App Parceiro" na aba Gerenciamento com exibição configurável por ambiente.',
      'Validação de URL para exibir apenas links seguros (http/https) no card parceiro.',
    ],
    details: [
      'A seção só aparece quando nome e URL do parceiro estão configurados corretamente.',
      'Também foram adicionados fallbacks de descrição/CTA e testes para renderização condicional.',
    ],
  },
  {
    version: '4.5.3',
    date: '2026-05-02',
    highlights: [
      'Filtro de mês da aba Transações agora permanece salvo ao sair e voltar para a tela.',
      'Restauração automática do período ativo com fallback seguro para o mês atual.',
    ],
    details: [
      'A implementação reaproveita o seletor existente, sem alterar o fluxo visual da tela.',
      'Também foi incluída validação do valor salvo localmente para evitar estado inválido.',
    ],
  },
  {
    version: '4.5.2',
    date: '2026-04-30',
    highlights: [
      'Correções de ortografia em pt-BR nos textos da interface.',
      'Nova validação automática para bloquear textos com erro de acentuação/encoding.',
    ],
    details: [
      'A validação agora verifica strings da interface e acusa termos com ortografia inválida comum.',
      'Também foi corrigida a qualidade textual nas mensagens de Gerenciamento e Atualizações.',
    ],
  },
  {
    version: '4.5.1',
    date: '2026-04-30',
    highlights: [
      'Nova seção "Apoie o FinDash" na aba Gerenciamento para colaborações via Pix.',
      'Botão para copiar chave Pix com mensagem de sucesso e fallback de erro.',
    ],
    details: [
      'A chave Pix agora é lida por variável de ambiente para facilitar configuração por ambiente.',
      'Quando a chave não estiver configurada, o app informa sem quebrar a interface.',
    ],
  },
  {
    version: '4.5.0',
    date: '2026-04-30',
    highlights: [
      'Menu mobile com arraste horizontal mais fluido para acessar todas as abas.',
      'Notificação de novidades por versão para destacar recursos novos.',
      'Nova aba "Atualizações" com histórico de releases e melhorias.',
    ],
    details: [
      'Ao clicar na notificação, o app abre a aba de atualizações.',
      'A versão atual é marcada como visualizada após o acesso à aba.',
    ],
  },
  {
    version: '4.4.1',
    date: '2026-04-30',
    highlights: [
      'Aba Gerenciamento com suporte, documentos legais e backup manual.',
      'Exportação e importação de backup JSON com validação de estrutura.',
    ],
  },
];

export const getReleaseByVersion = (version: string) =>
  RELEASE_NOTES.find((release) => release.version === version);
