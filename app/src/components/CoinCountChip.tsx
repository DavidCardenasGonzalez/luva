import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCoins } from '../purchases/CoinBalanceProvider';

type Props = {
  style?: ViewStyle;
  variant?: 'dark' | 'light';
};

export default function CoinCountChip({ style, variant = 'dark' }: Props) {
  const { balance, isUnlimited, loading } = useCoins();
  const palette =
    variant === 'light'
      ? {
          bg: '#e0f2fe',
          border: '#bfdbfe',
          text: '#0f172a',
          icon: '#0ea5e9',
        }
      : {
          bg: '#0f172a',
          border: '#1f2937',
          text: '#e2e8f0',
          icon: '#22d3ee',
        };

  const label = isUnlimited ? '∞' : loading ? '...' : String(balance);

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: palette.bg,
          borderWidth: 1,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      <MaterialIcons name="monetization-on" size={18} color={palette.icon} style={{ marginRight: 6 }} />
      <Text style={{ color: palette.text, fontWeight: '800' }}>{label}</Text>
    </View>
  );
}
