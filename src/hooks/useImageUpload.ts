import { useCallback, useState } from 'react';
import { useEditorStore } from '../stores/editorStore';
import type { EditorLayer } from '../types/editor';
import { PRINT_SIZES } from '../constants/printSizes';

// Lazy load heic2any - only needed for HEIC files
let heic2anyPromise: Promise<typeof import('heic2any')> | null = null;
const getHeic2any = () => {
  if (!heic2anyPromise) {
    heic2anyPromise = import('heic2any');
  }
  return heic2anyPromise;
};

// Max concurrent file processing to prevent memory spikes
const MAX_CONCURRENT_UPLOADS = 3;
// Max image dimension to reduce memory (300 DPI for 15cm = ~1800px, use 2000px for safety)
const MAX_IMAGE_DIMENSION = 2000;

// Generate unique ID
function generateId(): string {
  return `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Generate thumbnail for layer panel
function createThumbnail(img: HTMLImageElement, size = 64): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const ratio = Math.min(size / img.width, size / img.height);
  canvas.width = img.width * ratio;
  canvas.height = img.height * ratio;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
  // Help GC by clearing canvas
  canvas.width = 0;
  canvas.height = 0;
  return dataUrl;
}

// Check if file is HEIC format
function isHeicFile(file: File): boolean {
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif')
  );
}

// Process file and convert HEIC if needed
async function processFile(file: File): Promise<Blob> {
  if (isHeicFile(file)) {
    const heicModule = await getHeic2any();
    const result = await heicModule.default({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    });
    return Array.isArray(result) ? result[0] : result;
  }
  return file;
}

// Downsample image if too large to reduce memory usage
function downsampleImage(img: HTMLImageElement): { image: HTMLImageElement; blobUrl: string } | Promise<{ image: HTMLImageElement; blobUrl: string }> {
  const { naturalWidth, naturalHeight } = img;

  // If image is small enough, return as-is
  if (naturalWidth <= MAX_IMAGE_DIMENSION && naturalHeight <= MAX_IMAGE_DIMENSION) {
    return { image: img, blobUrl: img.src };
  }

  // Calculate new dimensions maintaining aspect ratio
  const scale = Math.min(MAX_IMAGE_DIMENSION / naturalWidth, MAX_IMAGE_DIMENSION / naturalHeight);
  const newWidth = Math.round(naturalWidth * scale);
  const newHeight = Math.round(naturalHeight * scale);

  // Create downsampled image
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, newWidth, newHeight);

  // Revoke the original large image URL
  URL.revokeObjectURL(img.src);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to downsample image'));
        return;
      }

      // Clear canvas to free memory
      canvas.width = 0;
      canvas.height = 0;

      const url = URL.createObjectURL(blob);
      const newImg = new Image();
      newImg.onload = () => resolve({ image: newImg, blobUrl: url });
      newImg.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load downsampled image'));
      };
      newImg.src = url;
    }, 'image/jpeg', 0.92);
  });
}

// Load image from blob
function loadImage(blob: Blob): Promise<{ image: HTMLImageElement; blobUrl: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = async () => {
      try {
        const result = await downsampleImage(img);
        resolve(result);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

// Process files with concurrency limit
async function processWithConcurrencyLimit<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  limit: number
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function processNext(): Promise<void> {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      results[index] = await processor(items[index], index);
    }
  }

  // Start limited number of workers
  const workers = Array(Math.min(limit, items.length))
    .fill(null)
    .map(() => processNext());

  await Promise.all(workers);
  return results;
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addLayer, layers } = useEditorStore();

  // Process a single file into layer data
  const processSingleFile = async (file: File, index: number): Promise<Omit<EditorLayer, 'zIndex'> | null> => {
    try {
      // Process file (convert HEIC if needed)
      const processedBlob = await processFile(file);

      // Load the image (with downsampling if needed)
      const { image: img, blobUrl } = await loadImage(processedBlob);

      // Create thumbnail
      const thumbnail = createThumbnail(img);

      // Position new images with slight offset based on index
      // Spread them out in a grid pattern
      const cols = 3; // Number of columns in the import grid
      const spacing = 20; // Space between images
      const col = index % cols;
      const row = Math.floor(index / cols);
      const baseOffsetX = 50 + col * (9 * 12 + spacing); // 9cm * 12ppc + spacing
      const baseOffsetY = 50 + row * (13 * 12 + spacing); // 13cm * 12ppc + spacing

      // Default to 9x13cm classic size
      const defaultSize = PRINT_SIZES[0]; // 9x13cm
      const isLandscape = img.naturalWidth > img.naturalHeight;
      
      // Calculate canvas display dimensions for 9x13cm
      const displayWidth = isLandscape 
        ? defaultSize.heightCm * 12  // 12 pixels per cm
        : defaultSize.widthCm * 12;
      const displayHeight = isLandscape 
        ? defaultSize.widthCm * 12
        : defaultSize.heightCm * 12;
      
      // Calculate crop to fit 9x13 aspect ratio
      const targetAspect = defaultSize.widthCm / defaultSize.heightCm;
      const imageAspect = img.naturalWidth / img.naturalHeight;
      
      let cropWidth: number, cropHeight: number, cropX: number, cropY: number;
      
      if (imageAspect > targetAspect) {
        // Image is wider - crop width
        cropHeight = img.naturalHeight;
        cropWidth = img.naturalHeight * targetAspect;
        cropX = (img.naturalWidth - cropWidth) / 2;
        cropY = 0;
      } else {
        // Image is taller - crop height
        cropWidth = img.naturalWidth;
        cropHeight = img.naturalWidth / targetAspect;
        cropX = 0;
        cropY = (img.naturalHeight - cropHeight) / 2;
      }

      // Create layer data with 9x13cm classic size by default
      const layerData: Omit<EditorLayer, 'zIndex'> = {
        id: generateId(),
        name: file.name || 'Untitled',
        type: 'image',
        imageElement: img,
        blobUrl, // Store for cleanup when layer is removed
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        thumbnail,
        x: baseOffsetX,
        y: baseOffsetY,
        rotation: 0,
        printSize: defaultSize,      // Default to 9x13cm
        isLandscape: isLandscape,    // Auto-detect based on image
        printMode: 'classic',        // Classic mode (fixed dimensions)
        fixedSide: null,             // Not applicable for classic
        cropX: cropX / img.naturalWidth,      // Normalized crop
        cropY: cropY / img.naturalHeight,
        cropWidth: cropWidth / img.naturalWidth,
        cropHeight: cropHeight / img.naturalHeight,
        displayWidth: displayWidth,   // 9x13cm at 12 PPCM
        displayHeight: displayHeight,
        visible: true,
        locked: false,
      };

      return layerData;
    } catch (err) {
      console.error('Failed to process image:', err);
      setError(`Failed to upload ${file.name}`);
      return null;
    }
  };

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setIsUploading(true);
      setError(null);

      const fileArray = Array.from(files);

      // Process files with concurrency limit to prevent memory spikes
      const results = await processWithConcurrencyLimit(
        fileArray,
        processSingleFile,
        MAX_CONCURRENT_UPLOADS
      );

      // Add all successfully processed layers to the store
      // Filter out null results (failed uploads)
      const validLayers = results.filter((layer): layer is NonNullable<typeof layer> => layer !== null);

      // Add layers in batch - much faster than adding one by one
      validLayers.forEach((layerData) => {
        addLayer(layerData);
      });

      setIsUploading(false);
    },
    [addLayer, layers.length]
  );

  const handleFileInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        uploadFiles(files);
      }
      // Reset input so same file can be selected again
      event.target.value = '';
    },
    [uploadFiles]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        uploadFiles(files);
      }
    },
    [uploadFiles]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  return {
    isUploading,
    error,
    handleFileInput,
    handleDrop,
    handleDragOver,
    uploadFiles,
  };
}
