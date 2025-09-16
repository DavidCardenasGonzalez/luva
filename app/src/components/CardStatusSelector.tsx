import React from 'react';
import { View, Text, Pressable, StyleProp, ViewStyle } from 'react-native';
import {
  CARD_STATUS_LABELS,
  CardProgressStatus,
  useCardProgress,
} from '../progress/CardProgressProvider';

const ORDERED_STATUSES: CardProgressStatus[] = ['todo', 'learning', 'learned'];

type Props = {
  cardId: string;
  title?: string;
  style?: StyleProp<ViewStyle>;
  allowedStatuses?: CardProgressStatus[];
  onStatusChange?: (status: CardProgressStatus) => void;
};

export default function CardStatusSelector({ cardId, title = 'Estado', style, allowedStatuses, onStatusChange }: Props) {
  const { loading, statusFor, setStatus } = useCardProgress();
  const current = statusFor(cardId);
  const statuses = allowedStatuses && allowedStatuses.length ? allowedStatuses : ORDERED_STATUSES;

  return (
    <View style={[{ marginTop: 16 }, style]}>
      <Text style={{ fontWeight: '600', marginBottom: 8 }}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {statuses.map((status) => {
          const active = status === current;
          return (
            <Pressable
              key={status}
              disabled={loading}
              onPress={async () => {
                await setStatus(cardId, status);
                onStatusChange?.(status);
              }}
              style={({ pressed }) => ({
                marginRight: 8,
                marginBottom: 8,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 999,
                borderWidth: active ? 0 : 1,
                borderColor: active ? '#2563eb' : '#d1d5db',
                backgroundColor: active ? '#2563eb' : pressed ? '#e5e7eb' : '#f9fafb',
              })}
            >
              <Text style={{ color: active ? 'white' : '#111827', fontWeight: active ? '700' : '500' }}>
                {CARD_STATUS_LABELS[status]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {loading ? (
        <Text style={{ color: '#6b7280', fontSize: 12 }}>Cargando progreso…</Text>
      ) : null}
    </View>
  );
}
