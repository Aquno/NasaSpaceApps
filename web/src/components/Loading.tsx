/**
 * What: Discreet loading indicator (small spinning ring + text) for content areas (D52).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
interface Props {
  text: string;
}

export function Loading({ text }: Props) {
  return (
    <p className="loading note" role="status">
      <span className="spinner" aria-hidden="true" />
      {text}
    </p>
  );
}
