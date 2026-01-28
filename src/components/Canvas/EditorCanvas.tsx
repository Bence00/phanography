import { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useEditorStore } from '../../stores/editorStore';
import { ImageLayer } from './ImageLayer';
import { SelectionTransformer } from './SelectionTransformer';
import { Grid } from './Grid';
import { ImageContextMenu } from '../ContextMenu';
import { CANVAS_PPCM } from '../../constants/canvasScale';

// Memoized info overlay
const InfoOverlay = memo(function InfoOverlay({ zoom, layerCount }: { zoom: number; layerCount: number }) {
  return (
    <div
      className="absolute top-3 left-3 z-10 px-3 py-2 rounded-lg text-sm"
      style={{ background: 'rgba(0,0,0,0.7)' }}
    >
      <span style={{ color: 'var(--accent)' }}>{Math.round(zoom * 100)}%</span>
      <span className="mx-2" style={{ color: 'var(--border-light)' }}>|</span>
      <span>{layerCount} photo{layerCount !== 1 ? 's' : ''}</span>
      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
        1cm = {CANVAS_PPCM}px
      </div>
    </div>
  );
});

// Memoized keyboard hints
const KeyboardHints = memo(function KeyboardHints() {
  return (
    <div
      className="absolute bottom-3 left-3 z-10 px-2 py-1.5 rounded text-xs"
      style={{ background: 'rgba(0,0,0,0.7)', color: 'var(--text-muted)' }}
    >
      <kbd className="px-1 rounded" style={{ background: 'var(--bg-elevated)' }}>Home</kbd> Front
      <span className="mx-1">·</span>
      <kbd className="px-1 rounded" style={{ background: 'var(--bg-elevated)' }}>End</kbd> Back
      <span className="mx-1">·</span>
      <kbd className="px-1 rounded" style={{ background: 'var(--bg-elevated)' }}>Del</kbd> Delete
    </div>
  );
});

export const EditorCanvas = memo(function EditorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [contextMenu, setContextMenu] = useState<{ layerId: string; x: number; y: number } | null>(null);

  // Select state from store
  const layers = useEditorStore((s) => s.layers);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);

  // Actions don't need equality check - they're stable references
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setPan = useEditorStore((s) => s.setPan);
  const setLayerPrintSize = useEditorStore((s) => s.setLayerPrintSize);
  const toggleLayerOrientation = useEditorStore((s) => s.toggleLayerOrientation);
  const setLayerPrintMode = useEditorStore((s) => s.setLayerPrintMode);
  const removeLayer = useEditorStore((s) => s.removeLayer);
  const reorderLayer = useEditorStore((s) => s.reorderLayer);
  const moveLayerToFront = useEditorStore((s) => s.moveLayerToFront);
  const moveLayerToBack = useEditorStore((s) => s.moveLayerToBack);

  // Resize observer for container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Wheel zoom handler
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.12;
    const oldScale = stage.scaleX();
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    setZoom(newScale);
    setPan(pointer.x - mousePointTo.x * newScale, pointer.y - mousePointTo.y * newScale);
  }, [setZoom, setPan]);

  // Stage click handler
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) clearSelection();
  }, [clearSelection]);

  // Stage drag handler
  const handleStageDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (e.target === stageRef.current) {
      setPan(e.target.x(), e.target.y());
    }
  }, [setPan]);

  // Context menu handlers
  const handleContextMenu = useCallback((layerId: string, x: number, y: number) => {
    setContextMenu({ layerId, x, y });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedLayerId) return;

      switch (e.key) {
        case 'Home':
          e.preventDefault();
          moveLayerToFront(selectedLayerId); // Single state update instead of loop
          break;
        case 'End':
          e.preventDefault();
          moveLayerToBack(selectedLayerId); // Single state update instead of loop
          break;
        case 'PageUp':
          e.preventDefault();
          reorderLayer(selectedLayerId, 'up');
          break;
        case 'PageDown':
          e.preventDefault();
          reorderLayer(selectedLayerId, 'down');
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          removeLayer(selectedLayerId);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, reorderLayer, removeLayer, moveLayerToFront, moveLayerToBack]);

  // Memoize sorted layers
  const sortedLayers = useMemo(
    () => [...layers].sort((a, b) => a.zIndex - b.zIndex),
    [layers]
  );

  const contextMenuLayer = contextMenu ? layers.find(l => l.id === contextMenu.layerId) : null;

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden relative" style={{ background: '#0a0a0a' }}>
      <InfoOverlay zoom={zoom} layerCount={layers.length} />
      <KeyboardHints />

      {dimensions.width > 0 && dimensions.height > 0 && (
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          onClick={handleStageClick}
          onTap={handleStageClick}
          onWheel={handleWheel}
          draggable
          x={panX}
          y={panY}
          onDragEnd={handleStageDragEnd}
          scaleX={zoom}
          scaleY={zoom}
        >
          <Layer>
            <Rect x={-10000} y={-10000} width={20000} height={20000} fill="#0a0a0a" listening={false} />
            <Grid zoom={zoom} />
            {sortedLayers.map((layer) => (
              <ImageLayer key={layer.id} layer={layer} onContextMenu={handleContextMenu} />
            ))}
            <SelectionTransformer selectedLayerId={selectedLayerId} layers={layers} />
          </Layer>
        </Stage>
      )}

      {contextMenu && contextMenuLayer && (
        <ImageContextMenu
          layer={contextMenuLayer}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={closeContextMenu}
          onSetPrintSize={(size, isLandscape, mode, fixedSide) => {
            setLayerPrintSize(contextMenuLayer.id, size, isLandscape, mode, fixedSide);
          }}
          onToggleOrientation={() => toggleLayerOrientation(contextMenuLayer.id)}
          onSetPrintMode={(mode, fixedSide) => setLayerPrintMode(contextMenuLayer.id, mode, fixedSide)}
          onDelete={() => { removeLayer(contextMenuLayer.id); closeContextMenu(); }}
          onBringToFront={() => moveLayerToFront(contextMenuLayer.id)}
          onSendToBack={() => moveLayerToBack(contextMenuLayer.id)}
        />
      )}
    </div>
  );
});

export function useStageRef() {
  return useRef<Konva.Stage>(null);
}
