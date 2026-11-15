/**
 * What: "Not found" screen for an unknown address or site (D53), with the header and a link to
 *   the mission panel. Also used for a site whose data file could not be loaded. Display only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';

interface Props {
  /** Title and explanation keys (unknown page, unknown site or unavailable site). */
  title?: MessageKey;
  text?: MessageKey;
  params?: Record<string, string>;
}

export function NotFound({ title = 'notFound.title', text = 'notFound.text', params = {} }: Props) {
  const { t } = useI18n();
  return (
    <div className="app">
      <Header sample={false} />
      <main className="not-found glass">
        <h1>{t(title, params)}</h1>
        <p>{t(text, params)}</p>
        <a className="linkbtn primary" href="#/mission">
          {t('notFound.toPanel')}
        </a>
      </main>
      <Footer />
    </div>
  );
}
