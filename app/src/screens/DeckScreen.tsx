import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useLearningItems } from '../hooks/useLearningItems';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Deck'>;

export default function DeckScreen({ navigation }: Props) {
  const { items } = useLearningItems();
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Learning Items</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('CardDetail', { id: String(item.id), label: item.label, example: item.example, options: item.options, answer: item.answer, explanation: item.explanation })}>
            <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text style={{ fontWeight: '600' }}>{item.label}</Text>
              <Text style={{ color: '#555' }} numberOfLines={1}>{item.example}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
