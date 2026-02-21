import React from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

export type TourHighlight = { x: number; y: number; width: number; height: number };

type Props = {
  visible: boolean;
  highlight: TourHighlight | null;
  title: string;
  description: string;
  onNext: () => void;
  isLast?: boolean;
};

export default function TourOverlay({
  visible,
  highlight,
  title,
  description,
  onNext,
  isLast = false,
}: Props) {
  const { height: screenHeight } = useWindowDimensions();

  if (!visible || !highlight) return null;

  const tooltipTop = Math.max(24, Math.min(highlight.y + highlight.height + 18, screenHeight - 240));

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, elevation: 20 }}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(3, 7, 18, 0.78)' }}
        onPress={onNext}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: Math.max(highlight.y - 12, 12),
            left: Math.max(highlight.x - 12, 12),
            width: highlight.width + 24,
            height: highlight.height + 24,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: '#22d3ee',
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            shadowColor: '#22d3ee',
            shadowOpacity: 0.4,
            shadowRadius: 12,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: tooltipTop,
            left: 16,
            right: 16,
            backgroundColor: '#0f172a',
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: '#1e293b',
            shadowColor: '#000',
            shadowOpacity: 0.35,
            shadowRadius: 14,
          }}
        >
          <Text style={{ color: '#22d3ee', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Tour inicial</Text>
          <Text style={{ color: '#e2e8f0', fontSize: 18, fontWeight: '800', marginTop: 4 }}>{title}</Text>
          <Text style={{ color: '#cbd5e1', marginTop: 6, lineHeight: 20 }}>
            {description}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
            <Pressable
              onPress={onNext}
              style={({ pressed }) => ({
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: pressed ? '#075985' : '#0ea5e9',
                shadowColor: '#0ea5e9',
                shadowOpacity: 0.25,
                shadowRadius: 8,
              })}
            >
              <Text style={{ color: 'white', fontWeight: '800' }}>{isLast ? 'Entendido' : 'Siguiente'}</Text>
            </Pressable>
          </View>
          <Text style={{ color: '#94a3b8', marginTop: 10, fontSize: 12 }}>Toca en cualquier parte para continuar.</Text>
        </View>
      </Pressable>
    </View>
  );
}
