import { db } from './db';

const STORAGE_KEY = 'findash_local_updated_at';

const listeners = new Set<() => void>();
let started = false;

export const getLocalUpdatedAt = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setLocalUpdatedAt = (iso: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, iso);
  } catch {
    // Armazenamento indisponível: o app segue funcionando, apenas sem a data de alteração.
  }
};

export const subscribeLocalChanges = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Registra a data da última gravação local e avisa os assinantes (idempotente). */
export const startLocalChangeTracking = () => {
  if (started) return;
  started = true;

  const onChange = () => {
    setLocalUpdatedAt(new Date().toISOString());
    listeners.forEach((listener) => listener());
  };

  db.tables.forEach((table) => {
    table.hook('creating', () => {
      onChange();
    });
    table.hook('updating', () => {
      onChange();
    });
    table.hook('deleting', () => {
      onChange();
    });
  });
};
