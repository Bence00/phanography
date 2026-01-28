import { memo, useMemo, type ReactElement } from 'react';
import { Group, Line } from 'react-konva';

interface GridProps {
  zoom: number;
}

export const Grid = memo(function Grid({ zoom }: GridProps) {
  // Compute zoom level category for memoization
  // 0 = zoomed out (<0.3), 1 = medium (0.3-0.6), 2 = zoomed in (>=0.6)
  const zoomLevel = zoom < 0.3 ? 0 : zoom < 0.6 ? 1 : 2;

  // Memoize grid lines based on zoom level threshold
  const lines = useMemo(() => {
    const gridSize = 12; // 1cm = 12px
    const majorGridSize = gridSize * 5; // 5cm

    // Adaptive grid detail based on zoom
    let minorGridSize = gridSize;
    if (zoomLevel === 0) minorGridSize = majorGridSize * 2;
    else if (zoomLevel === 1) minorGridSize = majorGridSize;

    const range = 5000;
    const steps = Math.ceil(range / minorGridSize);

    const result: ReactElement[] = [];
    const minorColor = '#1a1a1a';
    const majorColor = '#252525';
    const axisColor = '#333';

    // Batch create lines
    for (let i = -steps; i <= steps; i++) {
      const pos = i * minorGridSize;
      const isMajor = i % 5 === 0;
      const color = isMajor ? majorColor : minorColor;
      const width = isMajor ? 1 : 0.5;

      result.push(
        <Line key={`v${i}`} points={[pos, -range, pos, range]} stroke={color} strokeWidth={width} listening={false} />,
        <Line key={`h${i}`} points={[-range, pos, range, pos]} stroke={color} strokeWidth={width} listening={false} />
      );
    }

    // Axes
    result.push(
      <Line key="x" points={[-range, 0, range, 0]} stroke={axisColor} strokeWidth={1} listening={false} />,
      <Line key="y" points={[0, -range, 0, range]} stroke={axisColor} strokeWidth={1} listening={false} />
    );

    return result;
  }, [zoomLevel]); // Only recalc when crossing zoom thresholds

  return <Group>{lines}</Group>;
});
