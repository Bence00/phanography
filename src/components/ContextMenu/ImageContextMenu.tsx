import { memo, useEffect, useRef, useState, useCallback } from 'react';
import type { EditorLayer, PrintSize, PrintMode } from '../../types/editor';
import { PRINT_SIZES } from '../../constants/printSizes';
import { CANVAS_PPCM } from '../../constants/canvasScale';

interface Props {
  layer: EditorLayer;
  position: { x: number; y: number };
  onClose: () => void;
  onSetPrintSize: (size: PrintSize | null, isLandscape: boolean, mode: PrintMode, fixedSide: 'width' | 'height') => void;
  onToggleOrientation: () => void;
  onSetPrintMode: (mode: PrintMode, fixedSide: 'width' | 'height') => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

export const ImageContextMenu = memo(function ImageContextMenu({
  layer, position, onClose, onSetPrintSize, onToggleOrientation, onSetPrintMode, onDelete, onBringToFront, onSendToBack,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<PrintMode>(layer.printMode);
  const [fixedSide, setFixedSide] = useState<'width' | 'height'>(layer.fixedSide || 'width');

  // Close on outside click or escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const adjustedPos = {
    x: Math.min(position.x, window.innerWidth - 280),
    y: Math.min(position.y, window.innerHeight - 400),
  };

  const hasPrintSize = layer.printSize !== null;

  const handleModeChange = useCallback((newMode: PrintMode) => {
    setMode(newMode);
    if (hasPrintSize) onSetPrintMode(newMode, fixedSide);
  }, [hasPrintSize, onSetPrintMode, fixedSide]);

  const handleFixedSideChange = useCallback((side: 'width' | 'height') => {
    setFixedSide(side);
    if (hasPrintSize && mode === 'original') onSetPrintMode(mode, side);
  }, [hasPrintSize, mode, onSetPrintMode]);

  const selectSize = useCallback((size: PrintSize | null) => {
    onSetPrintSize(size, layer.isLandscape, mode, fixedSide);
    onClose();
  }, [onSetPrintSize, layer.isLandscape, mode, fixedSide, onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 py-2 w-64 rounded-lg shadow-xl animate-fade"
      style={{ left: adjustedPos.x, top: adjustedPos.y, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="px-3 py-2 flex items-center gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <img src={layer.thumbnail} alt="" className="w-8 h-8 rounded object-cover" />
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate">{layer.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{layer.originalWidth}×{layer.originalHeight}</p>
        </div>
      </div>

      {/* Print Mode */}
      <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>PRINT MODE</p>
        <div className="flex gap-1">
          {(['classic', 'original'] as const).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className="flex-1 py-1.5 text-xs rounded"
              style={{
                background: mode === m ? 'var(--accent)' : 'var(--bg-primary)',
                color: mode === m ? '#000' : 'var(--text-secondary)',
              }}
            >
              {m === 'classic' ? 'Classic' : 'Original'}
            </button>
          ))}
        </div>
        {mode === 'original' && (
          <div className="mt-2 flex gap-1">
            <span className="text-xs py-1" style={{ color: 'var(--text-muted)' }}>Fix:</span>
            {(['width', 'height'] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleFixedSideChange(s)}
                className="px-2 py-1 text-xs rounded"
                style={{
                  background: fixedSide === s ? 'var(--bg-hover)' : 'transparent',
                  color: fixedSide === s ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Print Sizes */}
      <div className="px-3 py-2 border-b max-h-40 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>SIZE</p>
        <button
          onClick={() => selectSize(null)}
          className="w-full text-left px-2 py-1.5 text-sm rounded mb-1"
          style={{ background: !hasPrintSize ? 'var(--bg-hover)' : 'transparent' }}
        >
          Free Form
        </button>
        {PRINT_SIZES.map((size) => {
          const isSelected = hasPrintSize && layer.printSize?.id === size.id;
          let dims: string;
          if (mode === 'original') {
            const aspect = layer.originalWidth / layer.originalHeight;
            if (fixedSide === 'width') {
              const w = size.widthCm * CANVAS_PPCM;
              dims = `${Math.round(w)}×${Math.round(w / aspect)}`;
            } else {
              const h = size.heightCm * CANVAS_PPCM;
              dims = `${Math.round(h * aspect)}×${Math.round(h)}`;
            }
          } else {
            dims = `${size.widthCm * CANVAS_PPCM}×${size.heightCm * CANVAS_PPCM}`;
          }

          return (
            <button
              key={size.id}
              onClick={() => selectSize(size)}
              className="w-full text-left px-2 py-1.5 text-sm rounded flex justify-between"
              style={{ background: isSelected ? 'var(--bg-hover)' : 'transparent' }}
            >
              <span>{size.name}cm</span>
              <span style={{ color: 'var(--text-muted)' }}>{dims}px</span>
            </button>
          );
        })}
      </div>

      {/* Orientation */}
      {hasPrintSize && layer.printSize!.widthInches !== layer.printSize!.heightInches && (
        <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => { onToggleOrientation(); onClose(); }}
            className="w-full text-left text-sm py-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            ↻ Rotate to {layer.isLandscape ? 'Portrait' : 'Landscape'}
          </button>
        </div>
      )}

      {/* Layer Order */}
      <div className="px-3 py-2 border-b flex gap-2" style={{ borderColor: 'var(--border)' }}>
        <button onClick={() => { onBringToFront(); onClose(); }} className="flex-1 text-sm py-1 rounded" style={{ background: 'var(--bg-primary)' }}>
          ↑ Front
        </button>
        <button onClick={() => { onSendToBack(); onClose(); }} className="flex-1 text-sm py-1 rounded" style={{ background: 'var(--bg-primary)' }}>
          ↓ Back
        </button>
      </div>

      {/* Delete */}
      <div className="px-3 py-2">
        <button
          onClick={() => { onDelete(); onClose(); }}
          className="w-full text-left text-sm py-1"
          style={{ color: 'var(--danger)' }}
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
});
