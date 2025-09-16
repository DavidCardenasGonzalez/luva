import React from 'react';
import { View, Text, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import CardStatusSelector from '../components/CardStatusSelector';

type Props = NativeStackScreenProps<RootStackParamList, 'CardDetail'>;

export default function CardDetailScreen({ route, navigation }: Props) {
  const { id, label, example, options, answer, explanation } = route.params;
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Item</Text>
      <Text style={{ marginTop: 8, fontWeight: '600' }}>{label}</Text>
      <Text style={{ marginTop: 8, color: '#555' }}>{example}</Text>
      <View style={{ height: 16 }} />
      <Button title="Comenzar práctica" onPress={() => navigation.navigate('Practice', { cardId: id, label, example, options, answer, explanation })} />
      <CardStatusSelector cardId={String(id)} />
    </View>
  );
}
