import { CloudUpload } from 'lucide-react';
import { useDriveSync } from '../context/DriveSyncContext';
import type { DriveSyncStatus } from '../context/DriveSyncContext';

const STATUS_LABEL: Record<DriveSyncStatus, string> = {
  desconectado: 'Desconectado',
  sincronizado: 'Sincronizado',
  pendente: 'Alterações pendentes',
  sincronizando: 'Sincronizando...',
  erro: 'Erro na sincronização',
};

const formatLastSync = (iso: string | null) => {
  if (!iso) return 'Nunca sincronizado';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Nunca sincronizado';
  return `Última sincronização: ${date.toLocaleString('pt-BR')}`;
};

const buttonPrimary =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed';
const buttonSecondary =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

export function DriveSyncCard() {
  const {
    available,
    status,
    message,
    lastSyncAt,
    autoRestore,
    previouslyAuthorized,
    setAutoRestore,
    connect,
    disconnect,
    syncNow,
    restoreFromDrive,
  } = useDriveSync();

  const connected = status !== 'desconectado';
  const busy = status === 'sincronizando';

  const handleRestore = () => {
    const confirmed = window.confirm('Deseja restaurar o backup do Google Drive e sobrescrever os dados atuais?');
    if (confirmed) void restoreFromDrive();
  };

  return (
    <article className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <CloudUpload size={18} className="text-primary" />
        <h3 className="font-semibold">Backup automático no Google Drive</h3>
      </div>

      {!available ? (
        <p className="text-sm text-muted-foreground">
          Recurso indisponível nesta instalação. Os dados continuam salvos apenas neste navegador.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Opcional. Envia uma cópia dos seus dados para uma pasta oculta do app no seu Google Drive. O app não
            acessa seus outros arquivos.
          </p>

          <div role="status" aria-live="polite" className="text-sm">
            <p className="font-medium">{STATUS_LABEL[status]}</p>
            {connected && <p className="text-xs text-muted-foreground">{formatLastSync(lastSyncAt)}</p>}
            {!connected && previouslyAuthorized && (
              <p className="text-xs text-muted-foreground">
                O Drive já foi autorizado neste navegador. Reconecte para retomar a sincronização.
              </p>
            )}
            {message && (
              <p className="mt-1 text-xs text-danger" role="alert">
                {message}
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRestore}
              onChange={(e) => setAutoRestore(e.target.checked)}
            />
            Restaurar automaticamente ao conectar, se o backup do Drive for mais recente
          </label>

          <div className="flex flex-col sm:flex-row gap-2">
            {!connected || status === 'erro' ? (
              <button type="button" onClick={() => void connect()} disabled={busy} className={buttonPrimary}>
                {connected || previouslyAuthorized ? 'Reconectar ao Google Drive' : 'Conectar ao Google Drive'}
              </button>
            ) : null}
            {connected && (
              <>
                <button type="button" onClick={() => void syncNow()} disabled={busy} className={buttonPrimary}>
                  Sincronizar agora
                </button>
                <button type="button" onClick={handleRestore} disabled={busy} className={buttonSecondary}>
                  Restaurar do Drive
                </button>
                <button type="button" onClick={disconnect} disabled={busy} className={buttonSecondary}>
                  Desconectar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
