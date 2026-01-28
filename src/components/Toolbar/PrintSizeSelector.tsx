import { memo, useCallback } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { PRINT_SIZES, getPrintDimensions, isSquareSize } from '../../constants/printSizes';

export const PrintSizeSelector = memo(function PrintSizeSelector() {
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const layers = useEditorStore((s) => s.layers);
  const setLayerPrintSize = useEditorStore((s) => s.setLayerPrintSize);
  const toggleLayerOrientation = useEditorStore((s) => s.toggleLayerOrientation);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  const onSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!selectedLayer) return;
    if (e.target.value === 'free') {
      setLayerPrintSize(selectedLayer.id, null);
    } else {
      const size = PRINT_SIZES.find((s) => s.id === e.target.value);
      if (size) setLayerPrintSize(selectedLayer.id, size);
    }
  }, [selectedLayer, setLayerPrintSize]);

  const onToggle = useCallback(() => {
    if (selectedLayer) toggleLayerOrientation(selectedLayer.id);
  }, [selectedLayer, toggleLayerOrientation]);

  if (!selectedLayer) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded text-sm" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
        Select a photo
      </div>
    );
  }

  const { printSize, isLandscape } = selectedLayer;
  const isSquare = printSize ? isSquareSize(printSize) : false;

  return (
    <div className="flex items-center gap-2">
      <select
        value={printSize?.id ?? 'free'}
        onChange={onSizeChange}
        className="px-3 py-1.5 rounded text-sm cursor-pointer"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
      >
        <option value="free">Free Size</option>
        {PRINT_SIZES.map((size) => (
          <option key={size.id} value={size.id}>{size.name} cm</option>
        ))}
      </select>

      {printSize && (
        <button
          onClick={onToggle}
          disabled={isSquare}
          className="p-1.5 rounded"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            opacity: isSquare ? 0.4 : 1,
            cursor: isSquare ? 'not-allowed' : 'pointer'
          }}
          title={isLandscape ? 'Landscape' : 'Portrait'}
        >
          <svg className={`w-5 h-5 ${isLandscape ? '' : 'rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <rect x="3" y="5" width="18" height="14" rx="2" />
          </svg>
        </button>
      )}

      {printSize && (
        <span className="text-sm hidden md:block" style={{ color: 'var(--accent)' }}>
          {(() => {
            const d = getPrintDimensions(printSize, isLandscape);
            return `${d.widthCm}×${d.heightCm}cm`;
          })()}
        </span>
      )}
    </div>
  );
});
