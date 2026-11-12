import { Megaphone } from 'lucide-react';
import { APP_NAME } from '../constants/app';
import { RELEASE_NOTES } from '../constants/releases';

export function Updates() {
  return (
    <div className="space-y-6">
      <section className="bg-card border border-border rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-2">
          <Megaphone className="text-primary" size={20} />
          <h2 className="text-xl font-semibold">Atualizações</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Confira os recursos mais recentes do {APP_NAME} e as melhorias de cada versão.
        </p>
      </section>

      <section className="space-y-4">
        {RELEASE_NOTES.map((release) => (
          <article key={release.version} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-semibold text-base">Versão {release.version}</h3>
              <span className="text-xs text-muted-foreground">{release.date}</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {release.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {release.details && release.details.length > 0 && (
              <ul className="list-disc pl-5 mt-3 space-y-1 text-sm text-muted-foreground">
                {release.details.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
