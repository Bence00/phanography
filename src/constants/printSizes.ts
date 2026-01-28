import type { PrintSize } from '../types/editor';

// DPI for print quality (for reference only - not used for canvas display)
export const PRINT_DPI = 300;

// Standard photo print sizes in centimeters
// Format: Short side is the "size" (9, 10, 11, 13 cm)
// Classic aspect ratio is typically 2:3 (like 10×15, 13×18)

export const PRINT_SIZES: PrintSize[] = [
  {
    id: '9x13',
    name: '9 × 13',
    widthCm: 9,
    heightCm: 13,
    widthInches: 3.54,
    heightInches: 5.12,
  },
  {
    id: '10x15',
    name: '10 × 15',
    widthCm: 10,
    heightCm: 15,
    widthInches: 3.94,
    heightInches: 5.91,
  },
  {
    id: '11x16',
    name: '11 × 16',
    widthCm: 11,
    heightCm: 16,
    widthInches: 4.33,
    heightInches: 6.30,
  },
  {
    id: '13x18',
    name: '13 × 18',
    widthCm: 13,
    heightCm: 18,
    widthInches: 5.12,
    heightInches: 7.09,
  },
];

// Default print size (10×15 cm)
export const DEFAULT_PRINT_SIZE = PRINT_SIZES[1];

// Get dimensions based on orientation (returns cm)
export function getPrintDimensions(
  size: PrintSize,
  isLandscape: boolean
): { width: number; height: number; widthCm: number; heightCm: number } {
  if (isLandscape) {
    return {
      width: size.heightCm,
      height: size.widthCm,
      widthCm: size.heightCm,
      heightCm: size.widthCm,
    };
  }
  return {
    width: size.widthCm,
    height: size.heightCm,
    widthCm: size.widthCm,
    heightCm: size.heightCm,
  };
}

// Check if a size is square (orientation toggle doesn't apply)
export function isSquareSize(size: PrintSize): boolean {
  return size.widthCm === size.heightCm;
}
