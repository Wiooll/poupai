import { isValidBackupSnapshot } from '../utils/localPersistence';
import type { FinanceBackupSnapshot } from '../types';

const BACKUP_FILE_NAME = 'findash-backup.json';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

export type DriveErrorKind = 'auth' | 'network' | 'invalid' | 'http';

export class DriveBackupError extends Error {
  readonly kind: DriveErrorKind;
  readonly retryable: boolean;

  constructor(kind: DriveErrorKind, message: string, retryable = false) {
    super(message);
    this.name = 'DriveBackupError';
    this.kind = kind;
    this.retryable = retryable;
  }
}

const getEnv = () => import.meta.env as Record<string, string | undefined>;

export const getGoogleClientId = () => getEnv().VITE_GOOGLE_CLIENT_ID?.trim() || '';

/** O recurso só existe quando a flag está ativa e há Client ID configurado. */
export const isDriveSyncAvailable = () =>
  getEnv().VITE_DRIVE_SYNC_ENABLED === 'true' && getGoogleClientId() !== '';

// ---------- Autorização (Google Identity Services) ----------

interface TokenResponse {
  access_token?: string;
  expires_in?: number | string;
  error?: string;
}

interface TokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}

interface GoogleOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type?: string }) => void;
  }) => TokenClient;
  revoke: (token: string, done?: () => void) => void;
}

const getOAuth2 = (): GoogleOAuth2 | undefined =>
  (window as unknown as { google?: { accounts?: { oauth2?: GoogleOAuth2 } } }).google?.accounts?.oauth2;

let scriptPromise: Promise<void> | null = null;

const loadGisScript = (): Promise<void> => {
  if (getOAuth2()) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      script.remove();
      reject(new DriveBackupError('network', 'Não foi possível carregar o serviço de login do Google.', true));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
};

export interface DriveToken {
  accessToken: string;
  expiresAt: number;
}

/** Solicita o token de acesso. O token deve ficar apenas em memória. */
export const requestDriveToken = async (prompt: '' | 'consent' = 'consent'): Promise<DriveToken> => {
  const clientId = getGoogleClientId();
  if (!clientId) throw new DriveBackupError('auth', 'Client ID do Google não configurado.');

  await loadGisScript();
  const oauth2 = getOAuth2();
  if (!oauth2) throw new DriveBackupError('network', 'Serviço de login do Google indisponível.', true);

  return new Promise<DriveToken>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new DriveBackupError('auth', 'Autorização do Google Drive negada ou cancelada.'));
          return;
        }
        const expiresInMs = (Number(response.expires_in) || 3600) * 1000;
        resolve({ accessToken: response.access_token, expiresAt: Date.now() + expiresInMs });
      },
      error_callback: () => {
        reject(new DriveBackupError('auth', 'Autorização do Google Drive cancelada ou bloqueada pelo navegador.'));
      },
    });
    client.requestAccessToken({ prompt });
  });
};

export const isTokenValid = (token: DriveToken | null, now = Date.now()): token is DriveToken =>
  !!token && token.expiresAt - 60_000 > now;

export const revokeDriveToken = (token: DriveToken | null) => {
  if (!token) return;
  getOAuth2()?.revoke(token.accessToken);
};

// ---------- API do Drive ----------

const driveFetch = async (token: DriveToken, url: string, init: RequestInit = {}): Promise<Response> => {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token.accessToken}` },
    });
  } catch {
    throw new DriveBackupError('network', 'Sem conexão com o Google Drive.', true);
  }

  if (response.status === 401 || response.status === 403) {
    throw new DriveBackupError('auth', 'Sessão do Google Drive expirada ou sem permissão.');
  }
  if (!response.ok) {
    const retryable = response.status === 429 || response.status >= 500;
    throw new DriveBackupError('http', `Falha na comunicação com o Google Drive (${response.status}).`, retryable);
  }
  return response;
};

const findBackupFileId = async (token: DriveToken): Promise<string | null> => {
  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    q: `name = '${BACKUP_FILE_NAME}' and trashed = false`,
    fields: 'files(id)',
    pageSize: '1',
  });
  const response = await driveFetch(token, `${DRIVE_API}/files?${params.toString()}`);
  const body = (await response.json()) as { files?: Array<{ id: string }> };
  return body.files?.[0]?.id ?? null;
};

/** Baixa o backup remoto. Retorna `null` quando ainda não existe arquivo. */
export const downloadSnapshot = async (token: DriveToken): Promise<FinanceBackupSnapshot | null> => {
  const fileId = await findBackupFileId(token);
  if (!fileId) return null;

  const response = await driveFetch(token, `${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media`);
  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    throw new DriveBackupError('invalid', 'O backup do Drive está corrompido.');
  }
  if (!isValidBackupSnapshot(parsed)) {
    throw new DriveBackupError('invalid', 'O backup do Drive tem estrutura inválida e foi ignorado.');
  }
  return parsed;
};

/** Cria ou atualiza o arquivo de backup do app no Drive. */
export const uploadSnapshot = async (token: DriveToken, snapshot: FinanceBackupSnapshot): Promise<void> => {
  const content = JSON.stringify(snapshot);
  const fileId = await findBackupFileId(token);

  if (fileId) {
    await driveFetch(
      token,
      `${DRIVE_UPLOAD_API}/files/${encodeURIComponent(fileId)}?uploadType=media`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: content },
    );
    return;
  }

  const boundary = `findash_${Date.now().toString(36)}`;
  const metadata = JSON.stringify({ name: BACKUP_FILE_NAME, parents: ['appDataFolder'] });
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n');

  await driveFetch(token, `${DRIVE_UPLOAD_API}/files?uploadType=multipart`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
};
