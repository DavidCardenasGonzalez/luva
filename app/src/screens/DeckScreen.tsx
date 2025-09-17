import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useLearningItems } from '../hooks/useLearningItems';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  CARD_STATUS_LABELS,
  CardProgressStatus,
  useCardProgress,
} from '../progress/CardProgressProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Deck'>;

const STATUS_ORDER: CardProgressStatus[] = ['todo', 'learning', 'learned'];
const STATUS_COLORS: Record<CardProgressStatus, string> = {
  todo: '#f97316',
  learning: '#06b6d4',
  learned: '#22c55e',
};

export default function DeckScreen({ navigation }: Props) {
  const { items } = useLearningItems();
  const { statusFor, statuses } = useCardProgress();
  const [activeStatuses, setActiveStatuses] = useState<CardProgressStatus[]>(['todo']);

  const { totals, percentages, filteredItems } = useMemo(() => {
    const counts: Record<CardProgressStatus, number> = { todo: 0, learning: 0, learned: 0 };
    const list = items.map((item) => ({ ...item, status: statusFor(item.id) }));
    for (const card of list) counts[card.status] += 1;
    const totalCount = list.length;
    const pct: Record<CardProgressStatus, number> = {
      todo: totalCount ? Math.round((counts.todo / totalCount) * 100) : 0,
      learning: totalCount ? Math.round((counts.learning / totalCount) * 100) : 0,
      learned: totalCount ? Math.round((counts.learned / totalCount) * 100) : 0,
    };
    const activeSet = new Set(activeStatuses.length ? activeStatuses : STATUS_ORDER);
    const filtered = list.filter((card) => activeSet.has(card.status));
    return { totals: counts, percentages: pct, filteredItems: filtered };
  }, [items, statuses, statusFor, activeStatuses]);

  const toggleStatus = (status: CardProgressStatus) => {
    setActiveStatuses((prev) => {
      if (prev.includes(status)) {
        if (prev.length === 1) return prev; // evitar dejar sin filtros
        return prev.filter((s) => s !== status);
      }
      return [...prev, status];
    });
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Learning Items</Text>

      <View style={{ marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 }}>
        <Text style={{ fontWeight: '600', marginBottom: 12 }}>Tu progreso</Text>
        <View style={{ height: 12, borderRadius: 999, overflow: 'hidden', flexDirection: 'row', backgroundColor: '#e5e7eb' }}>
          {STATUS_ORDER.map((status) => (
            <View
              key={status}
              style={{
                flexGrow: percentages[status],
                flexBasis: `${percentages[status]}%`,
                backgroundColor: STATUS_COLORS[status],
              }}
            />
          ))}
        </View>
        <View style={{ marginTop: 12 }}>
          {STATUS_ORDER.map((status) => (
            <View key={status} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: STATUS_COLORS[status], marginRight: 8 }} />
              <Text style={{ flex: 1 }}>{CARD_STATUS_LABELS[status]}</Text>
              <Text style={{ color: '#6b7280' }}>{percentages[status]}% ({totals[status]})</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap' }}>
        {STATUS_ORDER.map((status) => {
          const active = activeStatuses.includes(status);
          return (
            <Pressable
              key={status}
              onPress={() => toggleStatus(status)}
              style={({ pressed }) => ({
                marginRight: 8,
                marginBottom: 8,
                paddingVertical: 6,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: active ? STATUS_COLORS[status] : pressed ? '#e5e7eb' : '#f1f5f9',
              })}
            >
              <Text style={{ color: active ? 'white' : '#1f2937', fontWeight: active ? '700' : '500' }}>{CARD_STATUS_LABELS[status]}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('CardDetail', {
                id: String(item.id),
                label: item.label,
                examples: item.examples,
                options: item.options,
                answer: item.answer,
                explanation: item.explanation,
                prompt: item.prompt,
              })
            }
          >
            <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text style={{ fontWeight: '600' }}>{item.label}</Text>
              <Text style={{ color: '#555' }} numberOfLines={1}>
                {item.examples?.[0] || ''}
              </Text>
              <Text style={{ marginTop: 4, color: '#2563eb', fontSize: 12 }}>
                Estado: {CARD_STATUS_LABELS[item.status as CardProgressStatus]}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <Text style={{ color: '#6b7280' }}>No hay cards en este estado todavía.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}
