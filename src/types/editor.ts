export interface PrintSize {
  id: string;
  name: string;
  widthCm: number;
  heightCm: number;
  widthInches: number;  // For reference
  heightInches: number; // For reference
}

export interface Transform {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export type PrintMode = 'classic' | 'original';

export interface EditorLayer {
  id: string;
  name: string;
  type: 'image';

  // Image data
  imageElement: HTMLImageElement;
  blobUrl: string; // Track blob URL for cleanup
  originalWidth: number;
  originalHeight: number;
  thumbnail: string;

  // Transform properties
  x: number;
  y: number;
  rotation: number;

  // Print size for this layer (optional - null means free-form)
  printSize: PrintSize | null;
  isLandscape: boolean;
  
  // Print mode: 'classic' = fixed dimensions, 'original' = preserve aspect ratio
  printMode: PrintMode;
  // For 'original' mode: which side is fixed ('width' | 'height')
  fixedSide: 'width' | 'height' | null;

  // Crop settings for print framing (x, y are relative to image, 0-1 normalized)
  // Used in 'classic' mode
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;

  // Display dimensions on canvas (in canvas pixels)
  // When printSize is set, this equals the physical print dimensions
  // When null, image is displayed at natural size
  displayWidth: number;
  displayHeight: number;

  // Stacking
  zIndex: number;

  // Visibility
  visible: boolean;
  locked: boolean;
}

export interface EditorState {
  // Viewport
  zoom: number;
  panX: number;
  panY: number;

  // Layers
  layers: EditorLayer[];
  selectedLayerId: string | null;
}

export interface EditorActions {
  addLayer: (layer: Omit<EditorLayer, 'zIndex'>) => void;
  updateLayer: (id: string, updates: Partial<Omit<EditorLayer, 'id' | 'type' | 'imageElement'>>) => void;
  removeLayer: (id: string) => void;
  selectLayer: (id: string | null) => void;
  reorderLayer: (id: string, direction: 'up' | 'down') => void;
  moveLayerToFront: (id: string) => void;
  moveLayerToBack: (id: string) => void;
  clearSelection: () => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setLayerPrintSize: (layerId: string, size: PrintSize | null, isLandscape?: boolean, mode?: PrintMode, fixedSide?: 'width' | 'height') => void;
  toggleLayerOrientation: (layerId: string) => void;
  setLayerCrop: (layerId: string, crop: { x: number; y: number; width: number; height: number }) => void;
  setLayerPrintMode: (layerId: string, mode: PrintMode, fixedSide?: 'width' | 'height') => void;
}

export type EditorStore = EditorState & EditorActions;
