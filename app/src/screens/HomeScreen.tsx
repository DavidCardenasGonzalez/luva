import React from 'react';
import { View, Text, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useProgress } from '../hooks/useProgress';
import { useAuth } from '../auth/AuthProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { data } = useProgress();
  const { isSignedIn, signIn, signOut } = useAuth();
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18 }}>Progress</Text>
      <Text>Points: {data?.points ?? 0} • Streak: {data?.streak ?? 0}</Text>
      <View style={{ marginTop: 12 }}>
        <Button title="Continue Cards" onPress={() => navigation.navigate('Deck')} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Button title="Stories" onPress={() => navigation.navigate('Stories')} />
      </View>
      <View style={{ marginTop: 12 }}>
        {!isSignedIn ? (
          <Button title="Sign in" onPress={() => { void signIn(); }} />
        ) : (
          <Button title="Sign out" onPress={() => { void signOut(); }} />
        )}
      </View>
    </View>
  );
}
