import React from 'react';
import { View, Text, Button } from 'react-native';

export default function OnboardingScreen() {
  const onLogin = () => {
    // TODO: Implement Cognito Hosted UI flow (WebView + redirect)
  };
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Welcome to Luva</Text>
      <Text style={{ marginTop: 8 }}>Login with Google or Apple via Cognito.</Text>
      <View style={{ marginTop: 16 }}>
        <Button title="Login" onPress={onLogin} />
      </View>
    </View>
  );
}

