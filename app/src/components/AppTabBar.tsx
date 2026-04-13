import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AppTabKey = 'home' | 'practice' | 'missions' | 'feed';

type TabConfig = {
  key: AppTabKey;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  route: 'Home' | 'Deck' | 'Stories' | 'Feed';
};

const TABS: TabConfig[] = [
  { key: 'home', label: 'Home', icon: 'home', route: 'Home' },
  { key: 'practice', label: 'Prácticas', icon: 'school', route: 'Deck' },
  { key: 'missions', label: 'Misiones', icon: 'flag', route: 'Stories' },
  { key: 'feed', label: 'Feed', icon: 'rss-feed', route: 'Feed' },
];

export default function AppTabBar({ active }: { active: AppTabKey }) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: Math.max(insets.bottom, 10),
        backgroundColor: 'rgba(11, 18, 36, 0.98)',
        borderTopWidth: 1,
        borderTopColor: '#1f2937',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              onPress={() => navigation.navigate(tab.route)}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 54,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isActive ? 'rgba(34, 211, 238, 0.14)' : 'transparent',
                opacity: pressed ? 0.78 : 1,
              })}
            >
              <MaterialIcons
                name={tab.icon}
                size={22}
                color={isActive ? '#22d3ee' : '#94a3b8'}
              />
              <Text
                style={{
                  color: isActive ? '#e2e8f0' : '#94a3b8',
                  fontSize: 11,
                  fontWeight: isActive ? '800' : '700',
                  marginTop: 3,
                }}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
