import { useState } from 'react';
import { Bug, Copy, FileText, HandHeart, LifeBuoy, Mail, ShieldCheck, Cookie, Cloud, Upload, Download } from 'lucide-react';
import { APP_VERSION } from '../constants/app';
import { useFinance } from '../context/FinanceContext';
import { isValidBackupSnapshot } from '../utils/localPersistence';
import { getPartnerPromotionConfig } from '../utils/partnerPromotion';
import type { FinanceBackupSnapshot } from '../types';

const SUPPORT_EMAIL = 'suporte.listae@gmail.com';
const SUPPORT_PIX_KEY = import.meta.env.VITE_SUPPORT_PIX_KEY?.trim() || '';
const PARTNER_PROMOTION = getPartnerPromotionConfig(import.meta.env as Record<string, string | undefined>);

const createMailtoLink = (type: 'suggestion' | 'bug') => {
  const subject = type === 'suggestion' ? '[FinDash] Sugestão' : '[FinDash] Bug';
  const body = type === 'suggestion'
    ? `Olá, equipe FinDash!%0D%0A%0D%0ADeixo abaixo minha sugestão:%0D%0A%0D%0A%0D%0AVersão do app: ${APP_VERSION}`
    : `Olá, equipe FinDash!%0D%0A%0D%0AIdentifiquei um bug com os detalhes abaixo:%0D%0A1. Passos para reproduzir:%0D%0A2. Resultado esperado:%0D%0A3. Resultado atual:%0D%0A%0D%0AVersão do app: ${APP_VERSION}`;
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${body}`;
};

export function Management() {
  const { getBackupSnapshot, restoreBackupSnapshot } = useFinance();
  const [legalDoc, setLegalDoc] = useState<'terms' | 'privacy' | 'cookies' | null>(null);
  const [message, setMessage] = useState<string>('');

  const maskPixKey = (key: string) => {
    if (key.length <= 8) return key;
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  const handleCopyPixKey = async () => {
    if (!SUPPORT_PIX_KEY) {
      setMessage('Chave Pix indisponível no momento.');
      return;
    }

    try {
      await navigator.clipboard.writeText(SUPPORT_PIX_KEY);
      setMessage('Chave Pix copiada com sucesso.');
    } catch {
      setMessage('Não foi possível copiar a chave Pix.');
    }
  };

  const handleExport = () => {
    const snapshot = getBackupSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `findash-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Backup exportado com sucesso.');
  };

  const handleImport = async (file: File | null) => {
    if (!file) return;
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as unknown;
      if (!isValidBackupSnapshot(parsed)) {
        setMessage('Arquivo inválido: estrutura de backup não reconhecida.');
        return;
      }
      const confirmed = window.confirm('Deseja restaurar este backup e sobrescrever os dados atuais?');
      if (!confirmed) return;
      await restoreBackupSnapshot(parsed as FinanceBackupSnapshot);
      setMessage('Backup restaurado com sucesso.');
    } catch {
      setMessage('Não foi possível importar o backup. Verifique o arquivo.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-card border border-border rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="text-primary" size={20} />
          <h2 className="text-xl font-semibold">Gerenciamento</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Centralize aqui os novos recursos de suporte, políticas e backup da aplicação.
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <article className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <LifeBuoy size={18} className="text-primary" />
            <h3 className="font-semibold">Suporte e Feedback</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Envie sugestões ou reporte bugs para nosso canal oficial de atendimento.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href={createMailtoLink('suggestion')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Mail size={16} />
              Enviar sugestão
            </a>
            <a
              href={createMailtoLink('bug')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
            >
              <Bug size={16} />
              Reportar bug
            </a>
          </div>
        </article>

        <article className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Cloud size={18} className="text-primary" />
            <h3 className="font-semibold">Backup Manual</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Os dados ficam salvos no navegador (localStorage) com opção de backup manual no Google Drive.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Download size={16} />
              Exportar backup JSON
            </button>
            <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors cursor-pointer">
              <Upload size={16} />
              Importar backup JSON
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  void handleImport(file);
                }}
              />
            </label>
          </div>
          <a
            href="https://drive.google.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary hover:underline"
          >
            Abrir Google Drive para enviar ou baixar seus arquivos de backup
          </a>
        </article>

        <article className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <HandHeart size={18} className="text-primary" />
            <h3 className="font-semibold">Apoie o FinDash</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Sua contribuição ajuda a manter melhorias, correções e novos recursos.
          </p>
          {SUPPORT_PIX_KEY ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Chave Pix: <span className="font-medium text-foreground">{maskPixKey(SUPPORT_PIX_KEY)}</span>
              </p>
              <button
                type="button"
                onClick={() => void handleCopyPixKey()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Copy size={16} />
                Copiar chave Pix
              </button>
              <p className="text-xs text-muted-foreground">Contribuição opcional e espontânea.</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Chave Pix ainda não configurada para este ambiente.
            </p>
          )}
        </article>

        {PARTNER_PROMOTION && (
          <article className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <HandHeart size={18} className="text-primary" />
              <h3 className="font-semibold">App Parceiro</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {PARTNER_PROMOTION.description}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              {PARTNER_PROMOTION.disclosure}: <span className="font-medium text-foreground">{PARTNER_PROMOTION.name}</span>
            </p>
            <a
              href={PARTNER_PROMOTION.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {PARTNER_PROMOTION.ctaLabel}
            </a>
          </article>
        )}
      </section>

      <section className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={18} className="text-primary" />
          <h3 className="font-semibold">Documentos Legais</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setLegalDoc('terms')}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
          >
            <FileText size={15} />
            Termos de Uso
          </button>
          <button
            type="button"
            onClick={() => setLegalDoc('privacy')}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
          >
            <ShieldCheck size={15} />
            Privacidade
          </button>
          <button
            type="button"
            onClick={() => setLegalDoc('cookies')}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
          >
            <Cookie size={15} />
            Cookies
          </button>
        </div>
      </section>

      {message && (
        <section className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-sm text-primary">
          {message}
        </section>
      )}

      {legalDoc && (
        <section className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold">
              {legalDoc === 'terms' && 'Termos de Uso'}
              {legalDoc === 'privacy' && 'Política de Privacidade'}
              {legalDoc === 'cookies' && 'Política de Cookies'}
            </h4>
            <button
              type="button"
              onClick={() => setLegalDoc(null)}
              className="px-3 py-1 rounded-md border border-border text-xs hover:bg-secondary transition-colors"
            >
              Fechar
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Última atualização: 30/04/2026</p>
          {legalDoc === 'terms' && (
            <p className="text-sm text-muted-foreground">
              Ao utilizar o FinDash, você concorda em usar a aplicação de forma lícita e responsável.
              O serviço é fornecido para organização financeira pessoal, sem promessa de aconselhamento
              financeiro profissional.
            </p>
          )}
          {legalDoc === 'privacy' && (
            <p className="text-sm text-muted-foreground">
              O FinDash trata dados financeiros informados pelo usuário para exibição e gestão do próprio
              painel. O usuário pode solicitar suporte por e-mail e é responsável por manter seus backups
              em local seguro.
            </p>
          )}
          {legalDoc === 'cookies' && (
            <p className="text-sm text-muted-foreground">
              Utilizamos armazenamento local do navegador para manter preferências e dados da aplicação.
              Esses dados podem ser exportados e importados manualmente por meio de arquivos de backup.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
