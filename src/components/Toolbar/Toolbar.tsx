import { memo, useState, useCallback } from 'react';
import { UploadButton } from './UploadButton';
import { ExportButton } from './ExportButton';
import { PrintSizeSelector } from './PrintSizeSelector';
import { HelpPanel } from '../HelpPanel';

export const Toolbar = memo(function Toolbar() {
  const [helpOpen, setHelpOpen] = useState(false);
  const openHelp = useCallback(() => setHelpOpen(true), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);

  return (
    <>
      <header
        className="h-14 flex items-center px-4 gap-4 shrink-0"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-black font-bold"
            style={{ background: 'var(--accent)' }}
          >
            P
          </div>
          <span className="font-semibold hidden sm:block">Panography</span>
        </div>

        <div className="w-px h-6" style={{ background: 'var(--border)' }} />

        <PrintSizeSelector />

        <div className="flex-1" />

        {/* Actions */}
        <button onClick={openHelp} className="btn-ghost" title="Help (?)">
          <span className="hidden sm:inline">Help</span>
          <span className="sm:hidden">?</span>
        </button>
        <UploadButton />
        <ExportButton />
      </header>

      {helpOpen && <HelpPanel isOpen={helpOpen} onClose={closeHelp} />}
    </>
  );
});
