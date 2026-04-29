import React, { ReactNode } from 'react';
import { Text, TextStyle } from 'react-native';

type GradientTextProps = {
  children: string;
  colors?: [string, string, string?];
  style?: TextStyle;
};

type HighlightedCopyProps = {
  children: ReactNode;
  style?: TextStyle;
};

const DEFAULT_COLORS: [string, string, string] = ['#22d3ee', '#34d399', '#facc15'];

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function mixColor(left: string, right: string, ratio: number) {
  const leftRgb = hexToRgb(left);
  const rightRgb = hexToRgb(right);
  const mix = (start: number, end: number) => Math.round(start + (end - start) * ratio);

  return `rgb(${mix(leftRgb.r, rightRgb.r)}, ${mix(leftRgb.g, rightRgb.g)}, ${mix(leftRgb.b, rightRgb.b)})`;
}

function colorAt(index: number, total: number, colors: [string, string, string?]) {
  if (total <= 1) return colors[0];
  const progress = index / (total - 1);
  const middle = colors[2];

  if (!middle) {
    return mixColor(colors[0], colors[1], progress);
  }

  if (progress <= 0.5) {
    return mixColor(colors[0], colors[1], progress / 0.5);
  }

  return mixColor(colors[1], middle, (progress - 0.5) / 0.5);
}

export function GradientText({
  children,
  colors = DEFAULT_COLORS,
  style,
}: GradientTextProps) {
  const chars = Array.from(children);

  return (
    <Text style={style} accessibilityLabel={children}>
      {chars.map((char, index) => (
        <Text key={`${char}-${index}`} style={{ color: colorAt(index, chars.length, colors) }}>
          {char}
        </Text>
      ))}
    </Text>
  );
}

export function HighlightedCopy({ children, style }: HighlightedCopyProps) {
  return (
    <Text style={style}>
      {children}
    </Text>
  );
}
