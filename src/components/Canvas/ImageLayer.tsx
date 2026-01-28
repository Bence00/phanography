import { useRef } from 'react';
import { Image, Rect, Group, Text } from 'react-konva';
import type Konva from 'konva';
import type { EditorLayer } from '../../types/editor';
import { useEditorStore } from '../../stores/editorStore';

interface ImageLayerProps {
  layer: EditorLayer;
  onContextMenu: (layerId: string, x: number, y: number) => void;
}

export function ImageLayer({ layer, onContextMenu }: ImageLayerProps) {
  const imageRef = useRef<Konva.Image>(null);
  const groupRef = useRef<Konva.Group>(null);
  
  const { 
    updateLayer, 
    selectLayer, 
    selectedLayerId,
  } = useEditorStore();

  const isSelected = selectedLayerId === layer.id;
  const hasPrintSize = layer.printSize !== null;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    updateLayer(layer.id, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleTransformEnd = () => {
    const node = groupRef.current;
    if (!node) return;

    // Only update position and rotation - display size is fixed by print dimensions
    updateLayer(layer.id, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
    });
  };

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.cancelBubble = true; // Prevent stage click handler
    selectLayer(layer.id);
  };

  // Handle right-click context menu
  const handleContextMenu = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
    
    // Select the layer on right-click
    selectLayer(layer.id);
    
    // Notify parent to show context menu
    onContextMenu(layer.id, e.evt.clientX, e.evt.clientY);
  };

  if (!layer.visible) {
    return null;
  }

  // Calculate crop properties for Konva Image (which part of original image to show)
  const crop = {
    x: layer.cropX * layer.originalWidth,
    y: layer.cropY * layer.originalHeight,
    width: layer.cropWidth * layer.originalWidth,
    height: layer.cropHeight * layer.originalHeight,
  };

  // The image is displayed at displayWidth × displayHeight (physical print size on canvas)
  // The crop determines which part of the original image fills that space

  return (
    <Group
      ref={groupRef}
      id={layer.id}
      x={layer.x}
      y={layer.y}
      rotation={layer.rotation}
      draggable={!layer.locked}
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
      onContextMenu={handleContextMenu}
    >
      {/* The actual image with crop applied, displayed at PHYSICAL PRINT SIZE */}
      <Image
        ref={imageRef}
        image={layer.imageElement}
        x={0}
        y={0}
        width={layer.displayWidth}
        height={layer.displayHeight}
        crop={crop}
      />

      {/* Print frame indicator - shows the print boundaries */}
      {hasPrintSize && isSelected && (
        <>
          {/* Print frame border */}
          <Rect
            x={-2}
            y={-2}
            width={layer.displayWidth + 4}
            height={layer.displayHeight + 4}
            stroke="#3b82f6"
            strokeWidth={2}
            dash={[5, 5]}
            listening={false}
          />
          {/* Print size label */}
          <Group x={0} y={-28}>
            <Rect
              x={0}
              y={0}
              width={100}
              height={22}
              fill="#3b82f6"
              cornerRadius={4}
            />
            <Text
              x={0}
              y={4}
              width={100}
              align="center"
              text={layer.printSize!.name.replace('×', 'x') + (layer.isLandscape ? ' L' : ' P') + (layer.printMode === 'original' ? ' • O' : '')}
              fill="white"
              fontSize={10}
              fontStyle="bold"
            />
          </Group>
        </>
      )}
    </Group>
  );
}
