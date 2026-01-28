import { useCallback, useState, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { EditorCanvas } from './components/Canvas';
import { LayerPanel } from './components/Sidebar';
import { useImageUpload } from './hooks/useImageUpload';
import { useEditorStore } from './stores/editorStore';

function App() {
  const { handleDrop, handleDragOver, error } = useImageUpload();
  const [isDragging, setIsDragging] = useState(false);
  const [showError, setShowError] = useState(false);
  const layerCount = useEditorStore((s) => s.layers.length);

  // Error toast auto-dismiss
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget === e.target) setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    setIsDragging(false);
    handleDrop(e);
  }, [handleDrop]);

  return (
    <div
      className="h-full w-full flex flex-col"
      style={{ background: 'var(--bg-primary)' }}
      onDrop={onDrop}
      onDragOver={handleDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
    >
      <Toolbar />

      <div className="flex-1 flex overflow-hidden">
        <EditorCanvas />
        <LayerPanel />
      </div>

      {/* Drop zone overlay */}
      {isDragging && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)' }}
        >
          <div
            className="text-center p-8 rounded-xl"
            style={{ border: '2px dashed var(--accent)' }}
          >
            <div className="text-4xl mb-2">📷</div>
            <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              Drop photos here
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              PNG, JPEG, WebP, HEIC
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {layerCount === 0 && !isDragging && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-5xl mb-4 opacity-30">🖼️</div>
            <p className="text-lg mb-1" style={{ color: 'var(--text-secondary)' }}>
              No photos yet
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Drag photos here or click <span style={{ color: 'var(--accent)' }}>Add Photos</span>
            </p>
          </div>
        </div>
      )}

      {/* Error toast */}
      {showError && error && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg flex items-center gap-2 z-50 animate-fade"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--danger)' }}
        >
          <span style={{ color: 'var(--danger)' }}>⚠</span>
          <span>{error}</span>
          <button
            onClick={() => setShowError(false)}
            className="ml-2 opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
