// Canvas scale for true-to-life print preview
// This determines how many pixels on screen represent 1 cm in the real world

// At 8 PPCM: a 9×13cm print will be 72×104 pixels on screen
// At 12 PPCM: a 9×13cm print will be 108×156 pixels on screen (bigger, better visibility)
export const CANVAS_PPCM = 12; // Pixels per centimeter on the canvas (increased for better visibility)

// Helper to convert cm to canvas pixels
export function cmToCanvasPixels(cm: number): number {
  return cm * CANVAS_PPCM;
}

// Helper to convert canvas pixels to cm
export function canvasPixelsToCm(pixels: number): number {
  return pixels / CANVAS_PPCM;
}

// Get canvas dimensions for a print size in cm
export function getCanvasDimensions(
  widthCm: number,
  heightCm: number,
  isLandscape: boolean
): { width: number; height: number } {
  if (isLandscape) {
    return {
      width: cmToCanvasPixels(heightCm),
      height: cmToCanvasPixels(widthCm),
    };
  }
  return {
    width: cmToCanvasPixels(widthCm),
    height: cmToCanvasPixels(heightCm),
  };
}
