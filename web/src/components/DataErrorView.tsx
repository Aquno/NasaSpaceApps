/**
 * What: Message shown when the data cannot be used (D53): says whether files could not be
 *   downloaded (network / server) or arrived in an unexpected format (data contract), lists the
 *   files, keeps the technical detail collapsed, and offers "Try again". Display only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import type { DataProblem } from '../data/load';
import { useI18n } from '../i18n/I18nProvider';

interface Props {
  problems: DataProblem[];
  onRetry: () => void;
}

export function DataErrorView({ problems, onRetry }: Props) {
  const { t } = useI18n();
  const network = problems.some((p) => p.kind === 'network');
  const contract = problems.filter((p) => p.kind === 'contract');
  return (
    <section className="glass data-error" role="alert">
      <h2>{t(network ? 'error.networkTitle' : 'error.contractTitle')}</h2>
      <p>{t(network ? 'error.networkText' : 'error.contractText')}</p>
      <ul>
        {problems.map((p, k) => (
          <li key={k} className="mono">
            {p.kind === 'network'
              ? p.status === null
                ? t('error.fileNoResponse', { file: p.file })
                : t('error.fileHttp', { file: p.file, status: p.status })
              : t('error.fileContract', { file: p.file })}
          </li>
        ))}
      </ul>
      {contract.length > 0 && (
        <details>
          <summary>{t('error.details')}</summary>
          <ul className="mono">
            {contract.map((p, k) => (
              <li key={k}>
                {p.file}: {p.detail}
              </li>
            ))}
          </ul>
        </details>
      )}
      <button type="button" className="linkbtn primary" onClick={onRetry}>
        {t('error.retry')}
      </button>
    </section>
  );
}
