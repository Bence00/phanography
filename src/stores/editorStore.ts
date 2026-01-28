import { create } from 'zustand';
import type { EditorStore, EditorLayer } from '../types/editor';
import { getPrintDimensions, isSquareSize } from '../constants/printSizes';
import { getCanvasDimensions } from '../constants/canvasScale';

// Calculate centered crop for a given aspect ratio
function calculateCenteredCrop(
  imageWidth: number,
  imageHeight: number,
  targetWidth: number,
  targetHeight: number
): { x: number; y: number; width: number; height: number } {
  const imageAspect = imageWidth / imageHeight;
  const targetAspect = targetWidth / targetHeight;

  let cropWidth: number;
  let cropHeight: number;

  if (imageAspect > targetAspect) {
    // Image is wider than target - crop width
    cropHeight = imageHeight;
    cropWidth = imageHeight * targetAspect;
  } else {
    // Image is taller than target - crop height
    cropWidth = imageWidth;
    cropHeight = imageWidth / targetAspect;
  }

  // Center the crop
  const x = (imageWidth - cropWidth) / 2;
  const y = (imageHeight - cropHeight) / 2;

  return {
    x: x / imageWidth,      // Normalize to 0-1
    y: y / imageHeight,     // Normalize to 0-1
    width: cropWidth / imageWidth,   // Normalize to 0-1
    height: cropHeight / imageHeight, // Normalize to 0-1
  };
}

export const useEditorStore = create<EditorStore>((set) => ({
  // Viewport state
  zoom: 1,
  panX: 0,
  panY: 0,

  // Layers
  layers: [],
  selectedLayerId: null,

  // Layer actions
  addLayer: (layerData) => {
    set((state) => {
      const layer: EditorLayer = {
        ...layerData,
        zIndex: state.layers.length,
      };
      return {
        layers: [...state.layers, layer],
        selectedLayerId: layer.id,
      };
    });
  },

  updateLayer: (id, updates) => {
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, ...updates } : layer
      ),
    }));
  },

  removeLayer: (id) => {
    set((state) => {
      // Find layer to cleanup its blob URL
      const layerToRemove = state.layers.find((l) => l.id === id);
      if (layerToRemove?.blobUrl) {
        URL.revokeObjectURL(layerToRemove.blobUrl);
      }

      const newLayers = state.layers
        .filter((l) => l.id !== id)
        .map((l, i) => ({ ...l, zIndex: i }));

      return {
        layers: newLayers,
        selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
      };
    });
  },

  selectLayer: (id) => {
    set({ selectedLayerId: id });
  },

  reorderLayer: (id, direction) => {
    set((state) => {
      const index = state.layers.findIndex((l) => l.id === id);
      if (index === -1) return state;

      const newIndex = direction === 'up' ? index + 1 : index - 1;
      if (newIndex < 0 || newIndex >= state.layers.length) return state;

      const newLayers = [...state.layers];
      [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];

      return {
        layers: newLayers.map((l, i) => ({ ...l, zIndex: i })),
      };
    });
  },

  // Batch reorder to front/back in single state update
  moveLayerToFront: (id) => {
    set((state) => {
      const index = state.layers.findIndex((l) => l.id === id);
      if (index === -1 || index === state.layers.length - 1) return state;

      const layer = state.layers[index];
      const newLayers = [...state.layers.slice(0, index), ...state.layers.slice(index + 1), layer];

      return {
        layers: newLayers.map((l, i) => ({ ...l, zIndex: i })),
      };
    });
  },

  moveLayerToBack: (id) => {
    set((state) => {
      const index = state.layers.findIndex((l) => l.id === id);
      if (index === -1 || index === 0) return state;

      const layer = state.layers[index];
      const newLayers = [layer, ...state.layers.slice(0, index), ...state.layers.slice(index + 1)];

      return {
        layers: newLayers.map((l, i) => ({ ...l, zIndex: i })),
      };
    });
  },

  clearSelection: () => {
    set({ selectedLayerId: null });
  },

  // Viewport actions
  setZoom: (zoom) => {
    // Infinite zoom - no limits
    set({ zoom });
  },

  setPan: (x, y) => {
    set({ panX: x, panY: y });
  },

  // Per-layer print size actions - supports both CLASSIC and ORIGINAL aspect ratio modes
  setLayerPrintSize: (layerId, size, isLandscape = false, mode: 'classic' | 'original' = 'classic', fixedSide: 'width' | 'height' = 'width') => {
    set((state) => ({
      layers: state.layers.map((layer) => {
        if (layer.id !== layerId) return layer;

        if (size === null) {
          // Remove print size constraint, show at natural size (capped for usability)
          const maxDisplaySize = 200; // Cap at 200px for usability
          const scale = Math.min(
            maxDisplaySize / layer.originalWidth,
            maxDisplaySize / layer.originalHeight,
            1
          );
          
          return {
            ...layer,
            printSize: null,
            isLandscape: false,
            printMode: 'classic' as const,
            fixedSide: null,
            cropX: 0,
            cropY: 0,
            cropWidth: 1,
            cropHeight: 1,
            displayWidth: layer.originalWidth * scale,
            displayHeight: layer.originalHeight * scale,
          };
        }

        const imageAspect = layer.originalWidth / layer.originalHeight;

        if (mode === 'classic') {
          // CLASSIC MODE: Fixed dimensions, crop image to fit
          const canvasDims = getCanvasDimensions(
            size.widthCm,
            size.heightCm,
            isLandscape
          );

          // Calculate crop to match print aspect ratio (centered)
          // Convert cm dimensions to pixels for crop calculation
          const targetDimensions = getPrintDimensions(size, isLandscape);
          const targetWidthPx = (targetDimensions.widthCm / 2.54) * 300;
          const targetHeightPx = (targetDimensions.heightCm / 2.54) * 300;
          const crop = calculateCenteredCrop(
            layer.originalWidth,
            layer.originalHeight,
            targetWidthPx,
            targetHeightPx
          );

          return {
            ...layer,
            printSize: size,
            isLandscape,
            printMode: 'classic' as const,
            fixedSide: null,
            cropX: crop.x,
            cropY: crop.y,
            cropWidth: crop.width,
            cropHeight: crop.height,
            displayWidth: canvasDims.width,
            displayHeight: canvasDims.height,
          };
        } else {
          // ORIGINAL MODE: Preserve image aspect ratio, one side fixed
          // The fixed side determines the dimension from the print size
          // The other side is calculated to maintain original aspect ratio
          
          let displayWidth: number;
          let displayHeight: number;
          
          if (fixedSide === 'width') {
            // Width is fixed to the print size's width
            displayWidth = getCanvasDimensions(size.widthCm, size.heightCm, isLandscape).width;
            // Height is calculated to maintain aspect ratio
            displayHeight = displayWidth / imageAspect;
          } else {
            // Height is fixed to the print size's height
            displayHeight = getCanvasDimensions(size.widthCm, size.heightCm, isLandscape).height;
            // Width is calculated to maintain aspect ratio
            displayWidth = displayHeight * imageAspect;
          }

          // No cropping in original mode - show full image
          return {
            ...layer,
            printSize: size,
            isLandscape,
            printMode: 'original' as const,
            fixedSide,
            cropX: 0,
            cropY: 0,
            cropWidth: 1,
            cropHeight: 1,
            displayWidth,
            displayHeight,
          };
        }
      }),
    }));
  },

  toggleLayerOrientation: (layerId) => {
    set((state) => ({
      layers: state.layers.map((layer) => {
        if (layer.id !== layerId || !layer.printSize) return layer;
        if (isSquareSize(layer.printSize)) return layer;

        const newIsLandscape = !layer.isLandscape;
        const imageAspect = layer.originalWidth / layer.originalHeight;

        if (layer.printMode === 'original' && layer.fixedSide) {
          // ORIGINAL MODE: Swap which side is fixed when rotating
          const newFixedSide = layer.fixedSide === 'width' ? 'height' : 'width';
          
          let displayWidth: number;
          let displayHeight: number;
          
          if (newFixedSide === 'width') {
            displayWidth = getCanvasDimensions(layer.printSize.widthCm, layer.printSize.heightCm, newIsLandscape).width;
            displayHeight = displayWidth / imageAspect;
          } else {
            displayHeight = getCanvasDimensions(layer.printSize.widthCm, layer.printSize.heightCm, newIsLandscape).height;
            displayWidth = displayHeight * imageAspect;
          }

          return {
            ...layer,
            isLandscape: newIsLandscape,
            fixedSide: newFixedSide,
            displayWidth,
            displayHeight,
          };
        }

        // CLASSIC MODE: Fixed dimensions, recalculate crop
        const canvasDims = getCanvasDimensions(
          layer.printSize.widthCm,
          layer.printSize.heightCm,
          newIsLandscape
        );

        const targetDimensions = getPrintDimensions(layer.printSize, newIsLandscape);
        const targetWidthPx = (targetDimensions.widthCm / 2.54) * 300;
        const targetHeightPx = (targetDimensions.heightCm / 2.54) * 300;
        const crop = calculateCenteredCrop(
          layer.originalWidth,
          layer.originalHeight,
          targetWidthPx,
          targetHeightPx
        );

        return {
          ...layer,
          isLandscape: newIsLandscape,
          cropX: crop.x,
          cropY: crop.y,
          cropWidth: crop.width,
          cropHeight: crop.height,
          displayWidth: canvasDims.width,
          displayHeight: canvasDims.height,
        };
      }),
    }));
  },

  // Set print mode (classic or original)
  setLayerPrintMode: (layerId, mode, fixedSide = 'width') => {
    set((state) => ({
      layers: state.layers.map((layer) => {
        if (layer.id !== layerId || !layer.printSize) return layer;

        const imageAspect = layer.originalWidth / layer.originalHeight;

        if (mode === 'classic') {
          // Switch to CLASSIC: Fixed dimensions, crop image
          const canvasDims = getCanvasDimensions(
            layer.printSize.widthCm,
            layer.printSize.heightCm,
            layer.isLandscape
          );

          const targetDimensions = getPrintDimensions(layer.printSize, layer.isLandscape);
          const targetWidthPx = (targetDimensions.widthCm / 2.54) * 300;
          const targetHeightPx = (targetDimensions.heightCm / 2.54) * 300;
          const crop = calculateCenteredCrop(
            layer.originalWidth,
            layer.originalHeight,
            targetWidthPx,
            targetHeightPx
          );

          return {
            ...layer,
            printMode: 'classic' as const,
            fixedSide: null,
            cropX: crop.x,
            cropY: crop.y,
            cropWidth: crop.width,
            cropHeight: crop.height,
            displayWidth: canvasDims.width,
            displayHeight: canvasDims.height,
          };
        } else {
          // Switch to ORIGINAL: Preserve aspect ratio
          let displayWidth: number;
          let displayHeight: number;
          
          if (fixedSide === 'width') {
            displayWidth = getCanvasDimensions(layer.printSize.widthCm, layer.printSize.heightCm, layer.isLandscape).width;
            displayHeight = displayWidth / imageAspect;
          } else {
            displayHeight = getCanvasDimensions(layer.printSize.widthCm, layer.printSize.heightCm, layer.isLandscape).height;
            displayWidth = displayHeight * imageAspect;
          }

          return {
            ...layer,
            printMode: 'original' as const,
            fixedSide,
            cropX: 0,
            cropY: 0,
            cropWidth: 1,
            cropHeight: 1,
            displayWidth,
            displayHeight,
          };
        }
      }),
    }));
  },

  // Set custom crop position
  setLayerCrop: (layerId, crop) => {
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId
          ? { ...layer, cropX: crop.x, cropY: crop.y, cropWidth: crop.width, cropHeight: crop.height }
          : layer
      ),
    }));
  },
}));
