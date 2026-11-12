/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useFinance } from './FinanceContext';
import {
  DriveBackupError,
  downloadSnapshot,
  isDriveSyncAvailable,
  isTokenValid,
  requestDriveToken,
  revokeDriveToken,
  uploadSnapshot,
} from '../services/driveBackupService';
import type { DriveToken } from '../services/driveBackupService';
import {
  getLocalUpdatedAt,
  setLocalUpdatedAt,
  startLocalChangeTracking,
  subscribeLocalChanges,
} from '../services/localChangeTracker';
import { isLocalDataEmpty, resolveConflict } from '../utils/backupConflict';

export type DriveSyncStatus = 'desconectado' | 'sincronizado' | 'pendente' | 'sincronizando' | 'erro';

const PREFS_KEY = 'findash_drive_prefs';
const LAST_SYNC_KEY = 'findash_drive_last_sync';
const AUTHORIZED_KEY = 'findash_drive_authorized';
const DEBOUNCE_MS = 5000;
const RETRY_DELAYS_MS = [2000, 4000];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const readAutoRestore = (): boolean => {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? (JSON.parse(raw) as { autoRestore?: boolean }).autoRestore === true : false;
  } catch {
    return false;
  }
};

// Indicador (sem token) de que o usuário já concedeu acesso ao Drive neste navegador.
const readAuthorized = (): boolean => {
  try {
    return localStorage.getItem(AUTHORIZED_KEY) === 'true';
  } catch {
    return false;
  }
};

const writeAuthorized = (value: boolean) => {
  try {
    if (value) localStorage.setItem(AUTHORIZED_KEY, 'true');
    else localStorage.removeItem(AUTHORIZED_KEY);
  } catch {
    // Sem armazenamento: o consentimento será solicitado novamente na próxima conexão.
  }
};

const readLastSync = (): string | null => {
  try {
    return localStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
};

const toMessage = (error: unknown) =>
  error instanceof DriveBackupError ? error.message : 'Não foi possível sincronizar com o Google Drive.';

interface DriveSyncContextType {
  available: boolean;
  status: DriveSyncStatus;
  message: string;
  lastSyncAt: string | null;
  autoRestore: boolean;
  previouslyAuthorized: boolean;
  setAutoRestore: (value: boolean) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  syncNow: () => Promise<void>;
  restoreFromDrive: () => Promise<void>;
}

const DriveSyncContext = createContext<DriveSyncContextType | undefined>(undefined);

export const DriveSyncProvider = ({ children }: { children: ReactNode }) => {
  const { getBackupSnapshot, restoreBackupSnapshot, isDataLoaded } = useFinance();
  const available = useMemo(() => isDriveSyncAvailable(), []);

  const [status, setStatus] = useState<DriveSyncStatus>('desconectado');
  const [message, setMessage] = useState('');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(readLastSync);
  const [autoRestore, setAutoRestoreState] = useState<boolean>(readAutoRestore);

  // Token somente em memória (nunca persistido).
  const tokenRef = useRef<DriveToken | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blockedRef = useRef(false);
  const suppressRef = useRef(false);
  const runningRef = useRef(false);
  const silentTriedRef = useRef(false);
  const [previouslyAuthorized, setPreviouslyAuthorized] = useState<boolean>(readAuthorized);
  const getSnapshotRef = useRef(getBackupSnapshot);
  const restoreRef = useRef(restoreBackupSnapshot);
  const autoRestoreRef = useRef(autoRestore);

  useEffect(() => {
    getSnapshotRef.current = getBackupSnapshot;
    restoreRef.current = restoreBackupSnapshot;
    autoRestoreRef.current = autoRestore;
  }, [getBackupSnapshot, restoreBackupSnapshot, autoRestore]);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const markSynced = useCallback(() => {
    const now = new Date().toISOString();
    setLastSyncAt(now);
    try {
      localStorage.setItem(LAST_SYNC_KEY, now);
    } catch {
      // Sem armazenamento disponível: apenas não exibimos a data após recarregar.
    }
    setStatus('sincronizado');
    setMessage('');
  }, []);

  const handleFailure = useCallback((error: unknown) => {
    if (error instanceof DriveBackupError && error.kind === 'auth') {
      tokenRef.current = null;
      setStatus('erro');
      setMessage('Sessão do Google Drive expirada. Reconecte para continuar sincronizando.');
      return;
    }
    setStatus('erro');
    setMessage(toMessage(error));
  }, []);

  /** Garante um token válido; tenta renovar sem interação e, se falhar, pede reconexão. */
  const ensureToken = useCallback(async (): Promise<DriveToken> => {
    if (isTokenValid(tokenRef.current)) return tokenRef.current;
    if (!tokenRef.current) throw new DriveBackupError('auth', 'Google Drive não conectado.');
    const renewed = await requestDriveToken('');
    tokenRef.current = renewed;
    return renewed;
  }, []);

  const buildSnapshotToUpload = useCallback(() => {
    const snapshot = getSnapshotRef.current();
    // O `exportedAt` do Drive representa a última alteração dos dados, e não o momento do envio.
    return { ...snapshot, exportedAt: getLocalUpdatedAt() ?? snapshot.exportedAt };
  }, []);

  const uploadWithRetry = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setStatus('sincronizando');
    try {
      for (let attempt = 0; ; attempt += 1) {
        try {
          const token = await ensureToken();
          await uploadSnapshot(token, buildSnapshotToUpload());
          markSynced();
          return;
        } catch (error) {
          const retryable = error instanceof DriveBackupError && error.retryable;
          if (!retryable || attempt >= RETRY_DELAYS_MS.length) throw error;
          await wait(RETRY_DELAYS_MS[attempt]);
        }
      }
    } catch (error) {
      handleFailure(error);
    } finally {
      runningRef.current = false;
    }
  }, [buildSnapshotToUpload, ensureToken, handleFailure, markSynced]);

  const applyRemote = useCallback(async (remote: Awaited<ReturnType<typeof downloadSnapshot>>) => {
    if (!remote) return;
    clearTimer();
    suppressRef.current = true;
    try {
      await restoreRef.current(remote);
      setLocalUpdatedAt(remote.exportedAt);
    } finally {
      suppressRef.current = false;
    }
  }, []);

  // Rastreia gravações locais (sempre ativo quando o recurso está disponível).
  useEffect(() => {
    if (!available) return undefined;
    startLocalChangeTracking();

    const unsubscribe = subscribeLocalChanges(() => {
      if (suppressRef.current || !tokenRef.current || blockedRef.current) return;
      setStatus('pendente');
      setMessage('');
      clearTimer();
      timerRef.current = setTimeout(() => {
        void uploadWithRetry();
      }, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      clearTimer();
    };
  }, [available, uploadWithRetry]);

  /** Compara local x remoto logo após obter o token e envia ou restaura conforme a regra de conflito. */
  const runInitialSync = useCallback(async (token: DriveToken) => {
    setStatus('sincronizando');
    setMessage('');
    blockedRef.current = false;
    tokenRef.current = token;

    const remote = await downloadSnapshot(token);
    if (!remote) {
      await uploadWithRetry();
      return;
    }

    const localData = getSnapshotRef.current().data;
    const localUpdatedAt = getLocalUpdatedAt();
    const winner = resolveConflict(localUpdatedAt, remote.exportedAt, isLocalDataEmpty(localData));

    if (winner === 'remote') {
      if (autoRestoreRef.current) {
        await applyRemote(remote);
        markSynced();
      } else {
        blockedRef.current = true;
        setStatus('erro');
        setMessage('O backup do Drive é mais recente. Restaure do Drive ou envie o backup local para continuar.');
      }
      return;
    }

    if (remote.exportedAt === localUpdatedAt) {
      markSynced();
      return;
    }
    await uploadWithRetry();
  }, [applyRemote, markSynced, uploadWithRetry]);

  const connect = useCallback(async () => {
    if (!available) return;
    setStatus('sincronizando');
    setMessage('');
    try {
      // Quem já autorizou antes não vê a tela de consentimento de novo.
      const token = await requestDriveToken(readAuthorized() ? '' : 'consent');
      writeAuthorized(true);
      setPreviouslyAuthorized(true);
      await runInitialSync(token);
    } catch (error) {
      handleFailure(error);
    }
  }, [available, handleFailure, runInitialSync]);

  // Ao abrir o app, tenta reconectar em silêncio se o usuário já autorizou o Drive antes.
  // Se o navegador ou o Google exigirem interação, permanece desconectado até o clique em "Reconectar".
  useEffect(() => {
    // Só compara dados depois que o banco local terminou de carregar, para nunca tratar dados vazios como reais.
    if (!available || !isDataLoaded || !readAuthorized() || silentTriedRef.current) return;
    silentTriedRef.current = true;

    void (async () => {
      try {
        const token = await requestDriveToken('');
        await runInitialSync(token);
      } catch {
        tokenRef.current = null;
        setStatus('desconectado');
        setMessage('');
      }
    })();
  }, [available, isDataLoaded, runInitialSync]);

  const disconnect = useCallback(() => {
    clearTimer();
    revokeDriveToken(tokenRef.current);
    tokenRef.current = null;
    blockedRef.current = false;
    writeAuthorized(false);
    setPreviouslyAuthorized(false);
    setStatus('desconectado');
    setMessage('');
  }, []);

  const syncNow = useCallback(async () => {
    if (!tokenRef.current) {
      await connect();
      return;
    }
    clearTimer();
    blockedRef.current = false;
    await uploadWithRetry();
  }, [connect, uploadWithRetry]);

  const restoreFromDrive = useCallback(async () => {
    if (!tokenRef.current) {
      setStatus('erro');
      setMessage('Reconecte ao Google Drive para restaurar o backup.');
      return;
    }
    clearTimer();
    setStatus('sincronizando');
    try {
      const token = await ensureToken();
      const remote = await downloadSnapshot(token);
      if (!remote) {
        setStatus('erro');
        setMessage('Nenhum backup encontrado no Google Drive.');
        return;
      }
      await applyRemote(remote);
      blockedRef.current = false;
      markSynced();
    } catch (error) {
      handleFailure(error);
    }
  }, [applyRemote, ensureToken, handleFailure, markSynced]);

  const setAutoRestore = useCallback((value: boolean) => {
    setAutoRestoreState(value);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ autoRestore: value }));
    } catch {
      // Preferência vale apenas para esta sessão se o armazenamento estiver indisponível.
    }
  }, []);

  const value: DriveSyncContextType = {
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
  };

  return <DriveSyncContext.Provider value={value}>{children}</DriveSyncContext.Provider>;
};

export const useDriveSync = () => {
  const context = useContext(DriveSyncContext);
  if (!context) throw new Error('useDriveSync must be used within DriveSyncProvider');
  return context;
};
