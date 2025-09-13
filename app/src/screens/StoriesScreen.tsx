import React, { useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useStories } from '../hooks/useStories';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import UnlockModal from '../components/UnlockModal';

type Props = NativeStackScreenProps<RootStackParamList, 'Stories'>;

export default function StoriesScreen({ navigation }: Props) {
  const { items } = useStories();
  const [lockedInfo, setLockedInfo] = useState<{ title: string; cost: number } | null>(null);
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Stories</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => i.storyId}
        renderItem={({ item }) => (
          <Pressable onPress={() => item.locked ? setLockedInfo({ title: item.title, cost: item.unlockCost }) : navigation.navigate('StoryScene', { storyId: item.storyId, sceneIndex: 0 })}>
            <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text style={{ fontWeight: '600' }}>{item.title}</Text>
              <Text style={{ color: '#555' }}>{item.locked ? `Locked • ${item.unlockCost} pts` : 'Unlocked'}</Text>
            </View>
          </Pressable>
        )}
      />
      <UnlockModal visible={!!lockedInfo} onClose={() => setLockedInfo(null)} title={lockedInfo?.title || ''} cost={lockedInfo?.cost || 0} />
    </View>
  );
}
