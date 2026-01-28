import { memo, useCallback, useMemo } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import type { EditorLayer } from '../../types/editor';

// Memoized layer item to prevent re-renders
const LayerItem = memo(function LayerItem({
  layer,
  isSelected,
  onSelect,
  onToggleVisibility,
  onDelete,
}: {
  layer: EditorLayer;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className="flex items-center gap-2 p-2 rounded-lg cursor-pointer"
      style={{
        background: isSelected ? 'var(--accent-muted)' : 'var(--bg-elevated)',
        border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
      }}
    >
      {/* Thumbnail */}
      <div
        className="w-10 h-10 rounded overflow-hidden shrink-0"
        style={{ background: 'var(--bg-primary)', opacity: layer.visible ? 1 : 0.4 }}
      >
        <img src={layer.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{layer.name}</div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {layer.printSize ? (
            <span style={{ color: 'var(--accent)' }}>
              {layer.printSize.name}cm · {layer.isLandscape ? 'L' : 'P'}
            </span>
          ) : (
            `${Math.round(layer.displayWidth)}×${Math.round(layer.displayHeight)}`
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
          className="p-1.5 rounded hover:bg-black/20"
          style={{ color: layer.visible ? 'var(--text-secondary)' : 'var(--text-muted)' }}
          title={layer.visible ? 'Hide' : 'Show'}
        >
          {layer.visible ? '👁' : '👁‍🗨'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 rounded hover:bg-red-500/20"
          style={{ color: 'var(--text-muted)' }}
          title="Delete"
        >
          🗑
        </button>
      </div>
    </div>
  );
});

export const LayerPanel = memo(function LayerPanel() {
  const layers = useEditorStore((s) => s.layers);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const selectLayer = useEditorStore((s) => s.selectLayer);
  const removeLayer = useEditorStore((s) => s.removeLayer);
  const reorderLayer = useEditorStore((s) => s.reorderLayer);
  const updateLayer = useEditorStore((s) => s.updateLayer);

  // Sort layers by zIndex descending (top layers first)
  const sortedLayers = useMemo(
    () => [...layers].sort((a, b) => b.zIndex - a.zIndex),
    [layers]
  );

  const handleSelect = useCallback((id: string) => () => selectLayer(id), [selectLayer]);
  const handleToggleVisibility = useCallback(
    (id: string, visible: boolean) => () => updateLayer(id, { visible: !visible }),
    [updateLayer]
  );
  const handleDelete = useCallback((id: string) => () => removeLayer(id), [removeLayer]);
  const handleMoveUp = useCallback(() => {
    if (selectedLayerId) reorderLayer(selectedLayerId, 'up');
  }, [selectedLayerId, reorderLayer]);
  const handleMoveDown = useCallback(() => {
    if (selectedLayerId) reorderLayer(selectedLayerId, 'down');
  }, [selectedLayerId, reorderLayer]);

  return (
    <aside
      className="w-64 flex flex-col shrink-0"
      style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-sm font-medium">Layers</span>
        {layers.length > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            {layers.length}
          </span>
        )}
      </div>

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sortedLayers.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
            <div className="text-2xl mb-2 opacity-50">📷</div>
            <p className="text-sm">No photos yet</p>
          </div>
        ) : (
          sortedLayers.map((layer) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              isSelected={selectedLayerId === layer.id}
              onSelect={handleSelect(layer.id)}
              onToggleVisibility={handleToggleVisibility(layer.id, layer.visible)}
              onDelete={handleDelete(layer.id)}
            />
          ))
        )}
      </div>

      {/* Reorder controls */}
      {selectedLayerId && (
        <div className="p-2 flex justify-center gap-2" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={handleMoveUp} className="btn-ghost px-3 py-1.5 text-sm" title="Move Up (PgUp)">
            ↑ Up
          </button>
          <button onClick={handleMoveDown} className="btn-ghost px-3 py-1.5 text-sm" title="Move Down (PgDn)">
            ↓ Down
          </button>
        </div>
      )}
    </aside>
  );
});
