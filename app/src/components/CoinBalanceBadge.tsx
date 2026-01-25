import React, { useMemo } from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useCoins } from '../purchases/CoinBalanceProvider';

type Props = {
  style?: ViewStyle;
  variant?: 'dark' | 'light';
};

const formatEta = (nextRegenAt: number | null) => {
  if (!nextRegenAt) return null;
  const diff = nextRegenAt - Date.now();
  if (diff <= 0) return '<1 min';
  const minutes = Math.ceil(diff / 60_000);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }
  return `${minutes}m`;
};

export default function CoinBalanceBadge({ style, variant = 'dark' }: Props) {
  const { balance, maxCoins, isUnlimited, loading, nextRegenAt } = useCoins();
  const eta = useMemo(() => formatEta(nextRegenAt), [nextRegenAt]);

  const palette =
    variant === 'light'
      ? {
          bg: '#e0f2fe',
          border: '#bfdbfe',
          text: '#0f172a',
          muted: '#0ea5e9',
        }
      : {
          bg: '#0b172b',
          border: '#1f2937',
          text: '#e2e8f0',
          muted: '#22d3ee',
        };

  return (
    <View
      style={[
        {
          padding: 12,
          borderRadius: 14,
          backgroundColor: palette.bg,
          borderWidth: 1,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      <Text style={{ color: palette.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.4 }}>
        Monedas
      </Text>
      <Text style={{ color: palette.text, fontSize: 20, fontWeight: '800', marginTop: 2 }}>
        {isUnlimited ? '∞ ilimitadas' : `${loading ? '...' : balance}/${maxCoins}`}
      </Text>
      <Text style={{ color: palette.text, marginTop: 2, fontSize: 12 }}>
        {isUnlimited
          ? 'Pro: uso sin límites'
          : loading
          ? 'Sincronizando saldo...'
          : eta
          ? `+1 en ${eta}`
          : `+1 cada hora hasta ${maxCoins}`}
      </Text>
    </View>
  );
}
