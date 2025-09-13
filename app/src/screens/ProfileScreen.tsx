import React from 'react';
import { View, Text } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Profile</Text>
      <Text>Streaks, points, recent attempts.</Text>
    </View>
  );
}

