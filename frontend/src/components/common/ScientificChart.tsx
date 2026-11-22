import React, { useState } from 'react';

interface Point {
  x: number;
  y: number;
  label?: string;
}

interface Series {
  name: string;
  points: Point[];
  color?: string;
  lineDash?: string;
}

interface ScientificChartProps {
  title: string;
  xLabel: string;
  yLabel: string;
  xUnit?: string;
  yUnit?: string;
  series: Series[];
  height?: number;
  annotations?: string[];
}

export const ScientificChart: React.FC<ScientificChartProps> = ({
  title,
  xLabel,
  yLabel,
  xUnit = '',
  yUnit = '',
  series,
  height = 280,
  annotations = [],
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; seriesName: string } | null>(null);

  // Collect all points to determine extents
  const allPoints = series.flatMap((s) => s.points);
  if (allPoints.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center border border-[#303030] bg-[#141414] text-[#666] font-mono-sci text-xs">
        [NO SIMULATION PLOT DATA AVAILABLE]
      </div>
    );
  }

  const xMin = Math.min(...allPoints.map((p) => p.x));
  const xMax = Math.max(...allPoints.map((p) => p.x));
  const yMin = Math.min(0, Math.min(...allPoints.map((p) => p.y)));
  const yMax = Math.max(...allPoints.map((p) => p.y));

  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;

  // Chart padding
  const padding = { top: 30, right: 30, bottom: 45, left: 65 };
  const width = 600; // viewBox width

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const toSvgX = (x: number) => padding.left + ((x - xMin) / xSpan) * plotWidth;
  const toSvgY = (y: number) => padding.top + plotHeight - ((y - yMin) / ySpan) * plotHeight;

  // Ticks
  const numXTicks = 5;
  const numYTicks = 5;
  const xTicks = Array.from({ length: numXTicks + 1 }, (_, i) => xMin + (xSpan / numXTicks) * i);
  const yTicks = Array.from({ length: numYTicks + 1 }, (_, i) => yMin + (ySpan / numYTicks) * i);

  return (
    <div className="border border-[#303030] bg-[#141414] p-3 rounded-none relative">
      <div className="flex items-center justify-between border-b border-[#242424] pb-2 mb-2">
        <div className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4]">
          {title}
        </div>
        <div className="flex items-center gap-3">
          {series.map((s, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-[11px] font-mono-sci text-[#929292]">
              <span
                className="w-3 h-0.5 inline-block"
                style={{ backgroundColor: s.color || '#35C6D9' }}
              />
              {s.name}
            </div>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full select-none"
        style={{ maxHeight: `${height}px` }}
      >
        {/* Grid lines */}
        {yTicks.map((yVal, i) => {
          const yPos = toSvgY(yVal);
          return (
            <g key={`y-grid-${i}`}>
              <line
                x1={padding.left}
                y1={yPos}
                x2={width - padding.right}
                y2={yPos}
                stroke="#242424"
                strokeDasharray="2,2"
              />
              <text
                x={padding.left - 8}
                y={yPos + 3}
                fill="#666666"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="end"
              >
                {yVal >= 1000 ? yVal.toFixed(0) : yVal.toFixed(1)}
              </text>
            </g>
          );
        })}

        {xTicks.map((xVal, i) => {
          const xPos = toSvgX(xVal);
          return (
            <g key={`x-grid-${i}`}>
              <line
                x1={xPos}
                y1={padding.top}
                x2={xPos}
                y2={height - padding.bottom}
                stroke="#242424"
                strokeDasharray="2,2"
              />
              <text
                x={xPos}
                y={height - padding.bottom + 14}
                fill="#666666"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {xVal >= 10 ? xVal.toFixed(1) : xVal.toFixed(3)}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="#444444"
          strokeWidth="1"
        />
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#444444"
          strokeWidth="1"
        />

        {/* Labels */}
        <text
          x={padding.left + plotWidth / 2}
          y={height - 10}
          fill="#929292"
          fontSize="10"
          fontFamily="monospace"
          textAnchor="middle"
          fontWeight="bold"
        >
          {xLabel} {xUnit ? `(${xUnit})` : ''}
        </text>

        <text
          x={-(padding.top + plotHeight / 2)}
          y={15}
          fill="#929292"
          fontSize="10"
          fontFamily="monospace"
          textAnchor="middle"
          transform="rotate(-90)"
          fontWeight="bold"
        >
          {yLabel} {yUnit ? `(${yUnit})` : ''}
        </text>

        {/* Series Lines */}
        {series.map((s, sIdx) => {
          if (s.points.length === 0) return null;
          const pathD = s.points.reduce((acc, p, i) => {
            const px = toSvgX(p.x);
            const py = toSvgY(p.y);
            return i === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`;
          }, '');

          return (
            <g key={`series-${sIdx}`}>
              <path
                d={pathD}
                fill="none"
                stroke={s.color || '#35C6D9'}
                strokeWidth="1.75"
                strokeDasharray={s.lineDash || 'none'}
              />
              {/* Optional point markers if points count <= 30 */}
              {s.points.length <= 30 &&
                s.points.map((p, pIdx) => (
                  <circle
                    key={`point-${pIdx}`}
                    cx={toSvgX(p.x)}
                    cy={toSvgY(p.y)}
                    r="2.5"
                    fill={s.color || '#35C6D9'}
                    stroke="#0B0B0B"
                    strokeWidth="1"
                    className="cursor-pointer hover:r-4 transition-all"
                    onMouseEnter={() =>
                      setHoveredPoint({ x: p.x, y: p.y, seriesName: s.name })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}
            </g>
          );
        })}
      </svg>

      {/* Hover Info Tooltip */}
      {hoveredPoint && (
        <div className="absolute top-12 right-6 bg-[#191919] border border-[#35C6D9] px-2 py-1 text-[11px] font-mono-sci text-[#F4F4F4] shadow-md">
          <span className="text-[#35C6D9]">{hoveredPoint.seriesName}</span>: X={hoveredPoint.x} {xUnit}, Y={hoveredPoint.y} {yUnit}
        </div>
      )}

      {annotations.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[#222222] text-[10px] font-mono-sci text-[#777777]">
          {annotations.map((ann, i) => (
            <div key={i}>&bull; {ann}</div>
          ))}
        </div>
      )}
    </div>
  );
};
