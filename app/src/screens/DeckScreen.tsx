import React from 'react';
import { View, Text, FlatList } from 'react-native';

const mockCards = [
  { cardId: 'pv_set_up_001', type: 'phrasal', prompt: "What does 'set up' mean?" },
  { cardId: 'st_inversion_001', type: 'structure', prompt: 'Never had I...' },
];

export default function DeckScreen() {
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Cards</Text>
      <FlatList
        data={mockCards}
        keyExtractor={(i) => i.cardId}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 8 }}>
            <Text style={{ fontWeight: '500' }}>{item.type}</Text>
            <Text>{item.prompt}</Text>
          </View>
        )}
      />
    </View>
  );
}

