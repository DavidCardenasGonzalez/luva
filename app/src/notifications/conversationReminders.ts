import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_KEY_PREFIX = 'luva_conv_reminder:';
const REMINDER_DELAY_SECONDS = 24 * 60 * 60;

function storageKey(conversationKey: string): string {
  return `${REMINDER_KEY_PREFIX}${conversationKey}`;
}

export async function scheduleConversationReminderAsync(
  conversationKey: string,
  friendName: string,
): Promise<void> {
  if (Platform.OS === 'web') return;

  await cancelConversationReminderAsync(conversationKey);

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${friendName} sigue esperando tu respuesta`,
        body: 'Abre la app y continúa la conversación',
        data: { conversationKey },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: REMINDER_DELAY_SECONDS,
        repeats: false,
      },
    });
    await AsyncStorage.setItem(storageKey(conversationKey), notificationId);
  } catch (err: any) {
    console.warn('[ConvReminder] No se pudo programar el recordatorio:', err?.message || err);
  }
}

export async function cancelConversationReminderAsync(conversationKey: string): Promise<void> {
  if (Platform.OS === 'web') return;

  const key = storageKey(conversationKey);
  try {
    const existingId = await AsyncStorage.getItem(key);
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    }
  } catch {
    // ignore cancellation errors
  } finally {
    await AsyncStorage.removeItem(key).catch(() => {});
  }
}
