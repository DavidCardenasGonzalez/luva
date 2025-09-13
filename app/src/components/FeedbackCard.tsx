import React from 'react';
import { View, Text } from 'react-native';

export default function FeedbackCard({ feedback }: { feedback: { grammar: string[]; wording: string[]; naturalness: string[]; register: string[] } }) {
  if (!feedback) return null;
  const renderList = (title: string, arr: string[]) => (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ fontWeight: '600' }}>{title}</Text>
      {arr.map((t, i) => (
        <Text key={i}>• {t}</Text>
      ))}
    </View>
  );
  return (
    <View style={{ padding: 12, backgroundColor: 'white', borderRadius: 8 }}>
      {renderList('Grammar', feedback.grammar)}
      {renderList('Wording', feedback.wording)}
      {renderList('Naturalness', feedback.naturalness)}
      {renderList('Register', feedback.register)}
    </View>
  );
}

