import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function AuthCallbackScreen() {
  const nav = useNavigation();
  useEffect(() => {
    const t = setTimeout(() => nav.goBack(), 500);
    return () => clearTimeout(t);
  }, [nav]);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Completing sign-in...</Text>
    </View>
  );
}

