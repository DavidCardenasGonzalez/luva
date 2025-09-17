import React from 'react';
import { View, Text, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import CardStatusSelector from '../components/CardStatusSelector';

type Props = NativeStackScreenProps<RootStackParamList, 'CardDetail'>;

export default function CardDetailScreen({ route, navigation }: Props) {
  const { id, label, examples, options, answer, explanation, prompt } = route.params;
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Item</Text>
      <Text style={{ marginTop: 8, fontWeight: '600' }}>{label}</Text>
      {examples?.[0] ? <Text style={{ marginTop: 8, color: '#555' }}>{examples[0]}</Text> : null}
      {prompt ? (
        <Text style={{ marginTop: 8, color: '#6b7280', fontStyle: 'italic' }}>
          {`Úsalo en una oración, por ejemplo: ${prompt}`}
        </Text>
      ) : null}
      <View style={{ height: 16 }} />
      <Button
        title="Comenzar práctica"
        onPress={() =>
          navigation.navigate('Practice', {
            cardId: id,
            label,
            examples,
            options,
            answer,
            explanation,
            prompt,
          })
        }
      />
      <CardStatusSelector cardId={String(id)} />
    </View>
  );
}
