import React from 'react';
import { View, Text, Button } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18 }}>Progress</Text>
      <Text>Points: 0 • Streak: 0</Text>
      <View style={{ marginTop: 12 }}>
        <Button title="Continue Cards" onPress={() => {}} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Button title="Stories" onPress={() => {}} />
      </View>
    </View>
  );
}

