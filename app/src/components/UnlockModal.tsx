import React from 'react';
import { View, Text } from 'react-native';

export default function UnlockModal({ visible, onClose, title, cost }: { visible: boolean; onClose: () => void; title: string; cost: number; }) {
  if (!visible) return null;
  return (
    <View style={{ position: 'absolute', inset: 0 as any, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ padding: 16, backgroundColor: 'white', borderRadius: 8, width: '80%' }}>
        <Text style={{ fontWeight: '700', fontSize: 18 }}>Unlock "{title}"</Text>
        <Text style={{ marginTop: 8 }}>Cost: {cost} points</Text>
        <Text style={{ marginTop: 12 }} onPress={onClose}>Close</Text>
      </View>
    </View>
  );
}

