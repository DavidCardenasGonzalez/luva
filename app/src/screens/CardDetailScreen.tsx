import React from 'react';
import { View, Text, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'CardDetail'>;

export default function CardDetailScreen({ route, navigation }: Props) {
  const { cardId, prompt } = route.params;
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Card</Text>
      <Text style={{ marginTop: 8 }}>{prompt}</Text>
      <View style={{ height: 16 }} />
      <Button title="Practice" onPress={() => navigation.navigate('Practice', { cardId, prompt })} />
    </View>
  );
}

