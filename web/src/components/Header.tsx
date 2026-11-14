/**
 * What: Dashboard header: product name, context (lunar south pole, real NASA data), SAMPLE DATA
 *   badge when any file is marked as sample, and the "What this adds" dialog. Display only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useRef } from 'react';
import { WhatThisAddsTable } from './WhatThisAdds';

interface Props {
  sample: boolean;
}

export function Header({ sample }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <header className="header">
      <h1>Lunar Site Navigator</h1>
      <span className="context">Lunar south pole · real NASA data (JPL Horizons, LRO LOLA)</span>
      {sample && <span className="badge-sample">SAMPLE DATA</span>}
      <span className="spacer" />
      <a href="#/" className="linkbtn">
        Start
      </a>
      <button type="button" className="linkbtn" onClick={() => dialog.current?.showModal()}>
        What this adds ▸
      </button>
      <dialog ref={dialog} aria-label="What this tool adds">
        <WhatThisAddsTable />
        <form method="dialog">
          <button className="linkbtn" type="submit">
            Close
          </button>
        </form>
      </dialog>
    </header>
  );
}
