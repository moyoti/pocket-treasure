'use client';

import React, { useMemo } from 'react';
import { useLocale } from '@/contexts/LocaleContext';

interface PriceDataPoint {
  date: string;
  price: number;
}

interface MarketPriceChartProps {
  data: PriceDataPoint[];
  width?: number;
  height?: number;
}

const CHART_PADDING = {
  top: 16,
  right: 16,
  bottom: 28,
  left: 48,
};

const CHART_COLORS = {
  lineGradient: '#66C0F4',
  lineGradientEnd: 'rgba(102, 192, 244, 0.1)',
  grid: '#2A1810',
  gridAlpha: 0.1,
  text: '#6B7280',
  bg: '#171A22',
  bgLight: '#1B2838',
};

export default function MarketPriceChart({
  data,
  width = 400,
  height = 200,
}: MarketPriceChartProps) {
  const { t } = useLocale();
  const { minPrice, maxPrice, points, areaPath, linePath, trend } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        minPrice: 0,
        maxPrice: 100,
        points: [],
        areaPath: '',
        linePath: '',
        trend: 'neutral' as const,
      };
    }

    const prices = data.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1 || 10;
    const minPriceVal = Math.max(0, min - padding);
    const maxPriceVal = max + padding;

    const chartWidth = width - CHART_PADDING.left - CHART_PADDING.right;
    const chartHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;

    const calculatedPoints = data.map((d, i) => {
      const x = CHART_PADDING.left + (i / (data.length - 1)) * chartWidth;
      const y =
        CHART_PADDING.top +
        chartHeight -
        ((d.price - minPriceVal) / (maxPriceVal - minPriceVal)) * chartHeight;
      return { x, y, price: d.price, date: d.date };
    });

    const linePathStr = calculatedPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    const areaPathStr =
      calculatedPoints.length > 0
        ? `M ${CHART_PADDING.left} ${CHART_PADDING.top + chartHeight} ` +
          calculatedPoints.map((p) => `L ${p.x} ${p.y}`).join(' ') +
          ` L ${CHART_PADDING.left + chartWidth} ${CHART_PADDING.top + chartHeight} Z`
        : '';

    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const trendDirection = lastPrice >= firstPrice ? 'up' as const : 'down' as const;

    return {
      minPrice: minPriceVal,
      maxPrice: maxPriceVal,
      points: calculatedPoints,
      linePath: linePathStr,
      areaPath: areaPathStr,
      trend: trendDirection,
    };
  }, [data, width, height]);

  const yLabels = useMemo(() => {
    const count = 4;
    const labels = [];
    for (let i = 0; i <= count; i++) {
      const value = minPrice + ((maxPrice - minPrice) * i) / count;
      const y =
        CHART_PADDING.top +
        (height - CHART_PADDING.top - CHART_PADDING.bottom) -
        ((value - minPrice) / (maxPrice - minPrice)) *
          (height - CHART_PADDING.top - CHART_PADDING.bottom);
      labels.push({ value: Math.round(value), y });
    }
    return labels;
  }, [minPrice, maxPrice, height]);

  const gridLines = useMemo(() => {
    const count = 4;
    const lines = [];
    const chartHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;
    for (let i = 0; i <= count; i++) {
      const y = CHART_PADDING.top + (i / count) * chartHeight;
      lines.push(y);
    }
    return lines;
  }, [height]);

  const svgWidth = width;
  const svgHeight = height;

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg"
        style={{
          width,
          height,
          background: `linear-gradient(135deg, ${CHART_COLORS.bg} 0%, ${CHART_COLORS.bgLight} 100%)`,
        }}
      >
        <span style={{ color: CHART_COLORS.text, fontSize: 14 }}>暂无数据</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        width,
        height,
        background: `linear-gradient(135deg, ${CHART_COLORS.bg} 0%, ${CHART_COLORS.bgLight} 100%)`,
        border: '2px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={CHART_COLORS.lineGradient} stopOpacity={0.3} />
            <stop offset="100%" stopColor={CHART_COLORS.lineGradientEnd} stopOpacity={0} />
          </linearGradient>
        </defs>

        {gridLines.map((y, i) => (
          <line
            key={i}
            x1={CHART_PADDING.left}
            y1={y}
            x2={width - CHART_PADDING.right}
            y2={y}
            stroke={CHART_COLORS.grid}
            strokeWidth={1}
            opacity={CHART_COLORS.gridAlpha}
          />
        ))}

        {areaPath && (
          <path
            d={areaPath}
            fill="url(#chartGradient)"
            stroke="none"
          />
        )}

        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={trend === 'up' ? '#4CAF50' : '#F44336'}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={CHART_COLORS.bgLight}
            stroke={trend === 'up' ? '#4CAF50' : '#F44336'}
            strokeWidth={2}
            className="transition-all duration-200 hover:r-6"
          />
        ))}

        {yLabels.map((label, i) => (
          <text
            key={i}
            x={CHART_PADDING.left - 8}
            y={label.y + 4}
            textAnchor="end"
            fill={CHART_COLORS.text}
            fontSize={11}
            fontFamily="'Nunito', 'Segoe UI', sans-serif"
          >
            ¥{label.value}
          </text>
        ))}

        {data.length > 0 && (
          <>
            <text
              x={CHART_PADDING.left}
              y={height - 8}
              textAnchor="start"
              fill={CHART_COLORS.text}
              fontSize={11}
              fontFamily="'Nunito', 'Segoe UI', sans-serif"
            >
              {formatDate(data[0].date, t)}
            </text>
            <text
              x={width - CHART_PADDING.right}
              y={height - 8}
              textAnchor="end"
              fill={CHART_COLORS.text}
              fontSize={11}
              fontFamily="'Nunito', 'Segoe UI', sans-serif"
            >
              {formatDate(data[data.length - 1].date, t)}
            </text>
          </>
        )}

        {points.length > 1 && (
          <g transform={`translate(${width - CHART_PADDING.right - 60}, ${CHART_PADDING.top})`}>
            <rect
              x={0}
              y={0}
              width={56}
              height={24}
              rx={4}
              fill={trend === 'up' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)'}
            />
            <text
              x={28}
              y={16}
              textAnchor="middle"
              fill={trend === 'up' ? '#4CAF50' : '#F44336'}
              fontSize={12}
              fontWeight="bold"
              fontFamily="'Nunito', 'Segoe UI', sans-serif"
            >
              {trend === 'up' ? '↑' : '↓'} { Math.abs(
                Math.round(
                  ((points[points.length - 1].price - points[0].price) / points[0].price) * 100
                )
              )}%
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

function formatDate(dateStr: string, t: (key: string) => string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return t('market.today');
  } else if (diffDays === 1) {
    return t('market.yesterday');
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  }
}
