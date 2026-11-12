import { useState, type ReactNode } from 'react';
import { ArrowRight, CheckCircle2, FileSpreadsheet, ShieldCheck, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { APP_NAME, APP_VERSION } from '../constants/app';

const BENEFICIOS = [
  {
    title: 'Visão geral em tempo real',
    description: 'Acompanhe saldo, receitas, despesas e economia mensal em um único painel.',
    icon: TrendingUp,
  },
  {
    title: 'Metas com acompanhamento',
    description: 'Defina objetivos mensais e receba sinais claros de risco antes de estourar o orçamento.',
    icon: Target,
  },
  {
    title: 'Dados protegidos por usuário',
    description: 'Autenticação com Google e isolamento por conta para cada usuário autenticado.',
    icon: ShieldCheck,
  },
  {
    title: 'Importação e exportação',
    description: 'Importe transações por CSV e exporte relatórios em CSV, Excel e PDF.',
    icon: FileSpreadsheet,
  },
];

const PERGUNTAS_FREQUENTES = [
  {
    question: 'Preciso pagar para usar?',
    answer: `Não. Atualmente o ${APP_NAME} está disponível sem custos para uso pessoal.`,
  },
  {
    question: 'Meus dados ficam separados por usuário?',
    answer: 'Sim. Cada conta acessa somente os próprios dados após autenticação com Google.',
  },
  {
    question: 'Funciona no celular?',
    answer: 'Sim. O layout foi pensado para desktop e mobile com navegação adaptada.',
  },
];

const mapAuthError = (error: unknown) => {
  if (!(error instanceof Error)) return 'Não foi possível concluir a autenticação.';

  const code = error.message.toLowerCase();
  if (code.includes('auth/popup-closed-by-user')) return 'Login cancelado antes da conclusão.';
  if (code.includes('auth/popup-blocked')) return 'Seu navegador bloqueou o popup. Libere pop-ups e tente novamente.';
  if (code.includes('auth/account-exists-with-different-credential')) {
    return 'Já existe conta com este e-mail em outro provedor.';
  }
  if (code.includes('auth/operation-not-allowed')) {
    return 'Login com Google não está habilitado.';
  }
  if (code.includes('auth/too-many-requests')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }

  return 'Não foi possível concluir a autenticação.';
};

export const AuthGate = ({ children }: { children: ReactNode }) => {
  const { user, loading, signInWithGoogle } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const ctaLabelHero = submitting ? 'Conectando...' : 'Entrar e começar agora';
  const ctaLabelFinal = submitting ? 'Conectando...' : 'Criar minha conta gratuita';

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background text-foreground"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <p className="text-sm text-muted-foreground">Validando sessão...</p>
      </div>
    );
  }

  if (user) return children;

  const handleGoogleSignIn = async () => {
    setError('');
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden" aria-busy={submitting}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-info/10 blur-3xl" />
      </div>

      <main className="relative container mx-auto px-4 py-10 md:px-6 md:py-16 space-y-14">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">
              F
            </div>
            <div>
              <p className="font-semibold leading-tight">{APP_NAME}</p>
              <p className="text-xs text-muted-foreground">Controle financeiro pessoal</p>
            </div>
          </div>
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            Versão {APP_VERSION}
          </span>
        </header>

        <section className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center rounded-full bg-primary/10 text-foreground px-3 py-1 text-xs font-medium">
              Organize seus gastos com clareza
            </span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Controle seus gastos com metas, alertas e visão de futuro.
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              O {APP_NAME} centraliza transações, contas, cartões e insights para você decidir melhor hoje e
              no fim do mês.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => void handleGoogleSignIn()}
                disabled={submitting}
                aria-label="Entrar e começar agora com Google"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground px-6 py-4 text-base font-medium hover:opacity-95 disabled:opacity-70 disabled:cursor-not-allowed transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {ctaLabelHero}
                <ArrowRight size={16} />
              </button>
              <a
                href="#recursos"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-input bg-background px-6 py-4 text-base font-medium hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Ver recursos
              </a>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success" />
                Login com Google
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success" />
                Dados isolados por usuário
              </span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl shadow-sm p-6 space-y-4">
            <p className="text-sm text-muted-foreground">Resumo de um usuário no mês</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Receitas</p>
                <p className="text-lg font-semibold text-success">R$ 8.420,00</p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Despesas</p>
                <p className="text-lg font-semibold text-danger">R$ 5.210,00</p>
              </div>
              <div className="rounded-2xl border border-border p-4 col-span-2">
                <p className="text-xs text-muted-foreground">Economia projetada</p>
                <p className="text-lg font-semibold text-primary">R$ 3.210,00</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Exemplo ilustrativo de como seus dados aparecem no dashboard.
            </p>
          </div>
        </section>

        <section id="recursos" className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Recursos principais</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {BENEFICIOS.map((beneficio) => {
              const Icon = beneficio.icon;
              return (
                <article key={beneficio.title} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <Icon size={24} className="text-primary mb-3" />
                  <h3 className="font-semibold text-lg">{beneficio.title}</h3>
                  <p className="mt-1 text-base text-muted-foreground">{beneficio.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Como funciona</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-border bg-card p-6">
              <p className="text-sm text-foreground font-semibold">Passo 1</p>
              <h3 className="mt-1 font-semibold text-lg">Conecte sua conta</h3>
              <p className="mt-1 text-base text-muted-foreground">Entre com Google para habilitar seu ambiente.</p>
            </article>
            <article className="rounded-3xl border border-border bg-card p-6">
              <p className="text-sm text-foreground font-semibold">Passo 2</p>
              <h3 className="mt-1 font-semibold text-lg">Registre ou importe</h3>
              <p className="mt-1 text-base text-muted-foreground">Adicione transações manualmente ou por CSV.</p>
            </article>
            <article className="rounded-3xl border border-border bg-card p-6">
              <p className="text-sm text-foreground font-semibold">Passo 3</p>
              <h3 className="mt-1 font-semibold text-lg">Acompanhe os insights</h3>
              <p className="mt-1 text-base text-muted-foreground">Use metas e alertas para agir antes dos excessos.</p>
            </article>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Perguntas frequentes</h2>
          <div className="space-y-3">
            {PERGUNTAS_FREQUENTES.map((item) => (
              <details key={item.question} className="rounded-xl border border-border bg-card p-4 group">
                <summary className="cursor-pointer list-none font-medium flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md">
                  {item.question}
                  <span className="text-muted-foreground text-xs group-open:hidden">Abrir</span>
                  <span className="text-muted-foreground text-xs hidden group-open:inline">Fechar</span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-8 md:p-12 shadow-sm space-y-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Pronto para organizar sua vida financeira?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Entre agora e acompanhe sua evolução com dados claros, metas e alertas inteligentes.
          </p>
          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={submitting}
              aria-label="Criar minha conta gratuita com Google"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground px-8 py-4 text-base font-medium hover:opacity-95 disabled:opacity-70 disabled:cursor-not-allowed transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {ctaLabelFinal}
            </button>
          </div>
        </section>

        {error && (
          <div
            className="text-sm px-3 py-2 rounded-md border border-danger/40 bg-danger/10 text-danger max-w-2xl mx-auto"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <footer className="text-center text-xs text-muted-foreground">
          {APP_NAME} v{APP_VERSION} • Dados salvos localmente no seu navegador
        </footer>
      </main>
    </div>
  );
};
