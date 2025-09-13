import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, Button } from 'react-native';
import { useCards, Card } from '../hooks/useCards';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Deck'>;

export default function DeckScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<Card['type'] | undefined>(undefined);
  const { items } = useCards(filter);
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Cards</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginVertical: 8 }}>
        <Button title="All" onPress={() => setFilter(undefined)} />
        <Button title="Phrasal" onPress={() => setFilter('phrasal')} />
        <Button title="Structure" onPress={() => setFilter('structure')} />
        <Button title="Vocab" onPress={() => setFilter('vocab')} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.cardId}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('CardDetail', { cardId: item.cardId, prompt: item.prompt })}>
            <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text style={{ fontWeight: '600' }}>{item.prompt}</Text>
              <Text style={{ color: '#555' }}>{item.type} • {item.difficulty}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
