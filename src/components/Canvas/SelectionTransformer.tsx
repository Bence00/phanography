import { useRef, useEffect } from 'react';
import { Transformer } from 'react-konva';
import type Konva from 'konva';
import type { EditorLayer } from '../../types/editor';

interface SelectionTransformerProps {
  selectedLayerId: string | null;
  layers: EditorLayer[];
}

export function SelectionTransformer({
  selectedLayerId,
  layers,
}: SelectionTransformerProps) {
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (!transformerRef.current) return;

    const transformer = transformerRef.current;
    const stage = transformer.getStage();
    if (!stage) return;

    if (selectedLayerId) {
      // Find the selected layer
      const selectedLayer = layers.find((l) => l.id === selectedLayerId);
      if (selectedLayer && selectedLayer.visible && !selectedLayer.locked) {
        // Find the Konva node by id
        const node = stage.findOne(`#${selectedLayerId}`);
        if (node) {
          transformer.nodes([node]);
          transformer.getLayer()?.batchDraw();
          return;
        }
      }
    }

    // No selection or layer not found/visible/locked
    transformer.nodes([]);
    transformer.getLayer()?.batchDraw();
  }, [selectedLayerId, layers]);

  return (
    <Transformer
      ref={transformerRef}
      rotateEnabled={true}
      enabledAnchors={['rotater']}  // Only rotation, no resize (print sizes are fixed)
      anchorSize={8}
      anchorCornerRadius={2}
      borderStroke="#3b82f6"
      anchorStroke="#3b82f6"
      anchorFill="#ffffff"
      rotateAnchorOffset={20}
    />
  );
}
