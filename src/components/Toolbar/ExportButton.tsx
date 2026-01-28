import { memo, useState, useCallback } from 'react';

export const ExportButton = memo(function ExportButton() {
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const canvas = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement;
      if (!canvas) return;

      const link = document.createElement('a');
      link.download = `panography-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setExporting(false);
    }
  }, []);

  return (
    <button onClick={handleExport} disabled={exporting} className="btn btn-success">
      {exporting ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="hidden sm:inline">Exporting...</span>
        </>
      ) : (
        <>
          <span>↓</span>
          <span className="hidden sm:inline">Export</span>
        </>
      )}
    </button>
  );
});
