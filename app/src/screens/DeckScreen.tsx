import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLearningItems } from '../hooks/useLearningItems';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  CARD_STATUS_LABELS,
  CardProgressStatus,
  useCardProgress,
} from '../progress/CardProgressProvider';
import { useCoins, CARD_OPEN_COST } from '../purchases/CoinBalanceProvider';
import CoinCountChip from '../components/CoinCountChip';

type Props = NativeStackScreenProps<RootStackParamList, 'Deck'>;

const STATUS_ORDER: CardProgressStatus[] = ['learned', 'learning', 'todo'];
const STATUS_COLORS: Record<CardProgressStatus, string> = {
  learned: '#22c55e',
  learning: '#0ea5e9',
  todo: '#f59e0b',
};
const STATUS_BADGE_BG: Record<CardProgressStatus, string> = {
  learned: 'rgba(34, 197, 94, 0.14)',
  learning: 'rgba(14, 165, 233, 0.16)',
  todo: 'rgba(245, 158, 11, 0.18)',
};

export default function DeckScreen({ navigation }: Props) {
  const { items } = useLearningItems();
  const { statusFor, statuses } = useCardProgress();
  const { canSpend, loading: coinsLoading, isUnlimited } = useCoins();
  const [activeStatuses, setActiveStatuses] = useState<CardProgressStatus[]>(['todo']);

  const { totals, percentages, filteredItems, totalCount } = useMemo(() => {
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
    return { totals: counts, percentages: pct, filteredItems: filtered, totalCount };
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

  const handleOpenCard = async (item: any) => {
    if (!isUnlimited) {
      if (coinsLoading) {
        Alert.alert('Sincronizando monedas', 'Espera un momento, cargando tu saldo.');
        return;
      }
      const enough = await canSpend(CARD_OPEN_COST);
      if (!enough) {
        Alert.alert(
          'Monedas insuficientes',
          `Necesitas ${CARD_OPEN_COST} moneda${CARD_OPEN_COST === 1 ? '' : 's'} para abrir una tarjeta. Se regenera 1 por hora.`
        );
        return;
      }
    }
    navigation.navigate('Practice', {
      cardId: String(item.id),
      label: item.label,
      examples: item.examples,
      options: item.options,
      answer: item.answer,
      explanation: item.explanation,
      prompt: item.prompt,
    });
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: '#0b1224' }}
    >
      <FlatList
        data={filteredItems}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        ListHeaderComponent={
          <View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                height: 48,
                position: 'relative',
              }}
            >
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => ({
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: '#0f172a',
                  borderWidth: 1,
                  borderColor: '#1f2937',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.9 : 1,
                  shadowColor: '#000',
                  shadowOpacity: 0.12,
                  shadowRadius: 8,
                  position: 'absolute',
                  left: 0,
                })}
              >
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderLeftWidth: 2,
                    borderBottomWidth: 2,
                    borderColor: '#e2e8f0',
                    transform: [{ rotate: '45deg' }],
                  }}
                />
              </Pressable>
              <Image
                source={require('../image/logo.png')}
                style={{ width: 180, height: 42, resizeMode: 'contain' }}
              />
              <CoinCountChip style={{ position: 'absolute', right: 0 }} />
            </View>

            <View
              style={{
                borderRadius: 24,
                overflow: 'hidden',
                padding: 20,
                backgroundColor: '#0f172a',
                borderWidth: 1,
                borderColor: '#1f2937',
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 14,
                marginBottom: 16,
              }}
            >
              <View style={{ position: 'absolute', width: 200, height: 200, backgroundColor: '#0ea5e933', borderRadius: 200, top: -60, right: -60 }} />
              <View style={{ position: 'absolute', width: 160, height: 160, backgroundColor: '#22c55e22', borderRadius: 200, bottom: -50, left: -40 }} />
              <Text style={{ color: '#a5f3fc', fontSize: 12, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' }}>Panel de práctica</Text>
              <Text style={{ color: '#e2e8f0', fontSize: 24, fontWeight: '800', marginTop: 6 }}>
                Sigue impulsando tu avance
              </Text>
              <Text style={{ color: '#94a3b8', marginTop: 8, lineHeight: 20 }}>
                Visualiza y filtra tu mazo. Marca las tarjetas aprendidas para equilibrar tu progreso.
              </Text>

              <View style={{ marginTop: 16, backgroundColor: '#0b172b', borderColor: '#1f2937', borderWidth: 1, padding: 16, borderRadius: 16 }}>
                <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: '700' }}>Avance en tarjetas</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 6 }}>
                  <Text style={{ color: '#e2e8f0', fontSize: 34, fontWeight: '900' }}>
                    {totalCount ? `${percentages.learned}%` : '--'}
                  </Text>
                  <Text style={{ color: '#94a3b8', marginLeft: 8, marginBottom: 6, fontWeight: '600' }}>aprendidas</Text>
                </View>
                <View style={{ marginTop: 10, height: 12, borderRadius: 999, backgroundColor: '#1f2937', overflow: 'hidden' }}>
                  <View style={{ width: totalCount ? `${percentages.learned}%` : '0%', backgroundColor: '#22d3ee', height: '100%' }} />
                </View>
              </View>
              </View>
            <View style={{ marginTop: 14, backgroundColor: '#0f172a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1f2937' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: '#e2e8f0', fontWeight: '800', fontSize: 15 }}>Filtrar por estado</Text>
                <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                  Mostrando {filteredItems.length}/{totalCount || 0}
                </Text>
              </View>
              <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap' }}>
                {STATUS_ORDER.map((status) => {
                  const active = activeStatuses.includes(status);
                  return (
                    <Pressable
                      key={status}
                      onPress={() => toggleStatus(status)}
                      style={({ pressed }) => ({
                        marginRight: 8,
                        marginBottom: 8,
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        borderRadius: 999,
                        backgroundColor: active ? STATUS_COLORS[status] : '#111827',
                        borderWidth: 1,
                        borderColor: active ? STATUS_COLORS[status] : '#1f2937',
                        opacity: pressed ? 0.9 : 1,
                      })}
                    >
                      <Text style={{ color: active ? '#0b1224' : '#cbd5e1', fontWeight: '700' }}>
                        {CARD_STATUS_LABELS[status]} · {totals[status]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Text style={{ color: '#e2e8f0', fontWeight: '800', fontSize: 16, marginTop: 18, marginBottom: 8 }}>
              Tarjetas ({filteredItems.length} de {totalCount || 0})
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => void handleOpenCard(item)}
            style={({ pressed }) => ({
              padding: 16,
              borderRadius: 16,
              backgroundColor: '#0f172a',
              borderWidth: 1,
              borderColor: '#1f2937',
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 10,
              opacity: pressed ? 0.95 : 1,
              transform: [{ translateY: pressed ? 1 : 0 }],
            })}
          >
            <Text style={{ color: '#e2e8f0', fontWeight: '800', fontSize: 15 }}>
              {item.label}
            </Text>
            {!!item.examples?.[0] && (
              <Text style={{ color: '#94a3b8', marginTop: 6 }} numberOfLines={2}>
                {item.examples?.[0]}
              </Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: STATUS_BADGE_BG[item.status as CardProgressStatus],
                  borderWidth: 1,
                  borderColor: STATUS_COLORS[item.status as CardProgressStatus],
                }}
              >
                <Text style={{ color: '#ffffffff', fontWeight: '800', fontSize: 12 }}>
                  {CARD_STATUS_LABELS[item.status as CardProgressStatus]}
                </Text>
              </View>
              <Text style={{ color: '#cbd5e1', fontSize: 12, marginLeft: 10 }}>
                Toca para practicar
              </Text>
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={{ paddingVertical: 28, alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1f2937', marginTop: 12 }}>
            <Text style={{ color: '#e2e8f0', fontWeight: '700' }}>No hay cards en este estado todavía.</Text>
            <Text style={{ color: '#94a3b8', marginTop: 6, textAlign: 'center', paddingHorizontal: 20 }}>
              Ajusta los filtros o completa tarjetas para moverlas entre estados.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
