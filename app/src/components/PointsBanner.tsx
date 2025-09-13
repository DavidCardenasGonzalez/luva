import React from 'react';
import { View, Text } from 'react-native';

export default function PointsBanner({ points }: { points: number }) {
  return (
    <View style={{ padding: 12, backgroundColor: '#e0f2fe', borderRadius: 8 }}>
      <Text style={{ fontWeight: '600' }}>Points: {points}</Text>
    </View>
  );
}

