import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from '../api/api';

const PUSH_DEVICE_STORAGE_KEY = 'luva_push_device';
const PUSH_PERMISSION_REQUESTED_AT_KEY = 'luva_push_permission_requested_at';
const DEFAULT_ANDROID_CHANNEL_ID = 'default';

export type LocalPushDevice = {
  deviceId: string;
  expoPushToken?: string;
  projectId?: string;
  platform: string;
  appVersion?: string;
  buildVersion?: string;
  deviceName?: string;
  osName?: string;
  osVersion?: string;
  permissionStatus?: string;
  registeredUserId?: string;
  lastSyncedAt?: string;
  lastError?: string;
  updatedAt: string;
};

export type PushDeviceSyncResult = {
  localDevice?: LocalPushDevice;
  synced: boolean;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function getLocalPushDeviceAsync(): Promise<LocalPushDevice | undefined> {
  const raw = await AsyncStorage.getItem(PUSH_DEVICE_STORAGE_KEY);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Partial<LocalPushDevice>;
    if (!parsed.deviceId || typeof parsed.deviceId !== 'string') {
      return undefined;
    }
    return {
      ...parsed,
      deviceId: parsed.deviceId,
      platform: typeof parsed.platform === 'string' ? parsed.platform : Platform.OS,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return undefined;
  }
}

export async function ensureLocalPushDeviceAsync(): Promise<LocalPushDevice> {
  const previous = await getLocalPushDeviceAsync();
  const deviceId = previous?.deviceId || createLocalDeviceId();
  const metadata = getDeviceMetadata();
  const now = new Date().toISOString();
  let next: LocalPushDevice = {
    ...previous,
    ...metadata,
    deviceId,
    updatedAt: now,
  };

  if (Platform.OS === 'web') {
    next = {
      ...next,
      permissionStatus: 'unsupported',
      lastError: undefined,
    };
    await saveLocalPushDeviceAsync(next);
    return next;
  }

  await ensureAndroidNotificationChannelAsync();

  try {
    const permissions = await getNotificationPermissionsAsync();
    let permissionStatus = permissions?.status || previous?.permissionStatus || 'undetermined';

    if (permissionStatus !== 'granted' && permissions?.canAskAgain !== false) {
      const hasRequestedBefore = Boolean(await AsyncStorage.getItem(PUSH_PERMISSION_REQUESTED_AT_KEY));
      if (!hasRequestedBefore) {
        await AsyncStorage.setItem(PUSH_PERMISSION_REQUESTED_AT_KEY, now);
        const requested = await Notifications.requestPermissionsAsync();
        permissionStatus = requested.status;
      }
    }

    next = {
      ...next,
      permissionStatus,
    };

    if (permissionStatus !== 'granted') {
      next = {
        ...next,
        expoPushToken: undefined,
        projectId: undefined,
        lastError: undefined,
      };
      await saveLocalPushDeviceAsync(next);
      return next;
    }

    const projectId = getExpoProjectId();
    if (!projectId) {
      next = {
        ...next,
        lastError: 'missing_expo_project_id',
      };
      await saveLocalPushDeviceAsync(next);
      return next;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    next = {
      ...next,
      expoPushToken: token.data,
      projectId,
      lastError: undefined,
      updatedAt: new Date().toISOString(),
    };
    await saveLocalPushDeviceAsync(next);
    return next;
  } catch (err: any) {
    next = {
      ...next,
      lastError: formatPushError(err),
      updatedAt: new Date().toISOString(),
    };
    await saveLocalPushDeviceAsync(next);
    return next;
  }
}

export async function syncRegisteredPushDeviceAsync(userId?: string): Promise<PushDeviceSyncResult> {
  const localDevice = await ensureLocalPushDeviceAsync();

  await api.post('/users/me/devices', {
    deviceId: localDevice.deviceId,
    expoPushToken: localDevice.expoPushToken,
    platform: localDevice.platform,
    appVersion: localDevice.appVersion,
    buildVersion: localDevice.buildVersion,
    deviceName: localDevice.deviceName,
    osName: localDevice.osName,
    osVersion: localDevice.osVersion,
    permissionStatus: localDevice.permissionStatus,
  });

  const syncedDevice = {
    ...localDevice,
    registeredUserId: userId,
    lastSyncedAt: new Date().toISOString(),
    lastError: undefined,
  };
  await saveLocalPushDeviceAsync(syncedDevice);

  return { localDevice: syncedDevice, synced: true };
}

export async function unregisterRegisteredPushDeviceAsync(): Promise<void> {
  const localDevice = await getLocalPushDeviceAsync();
  if (!localDevice?.deviceId) {
    return;
  }

  try {
    await api.delete(`/users/me/devices/${encodeURIComponent(localDevice.deviceId)}`);
  } finally {
    await saveLocalPushDeviceAsync({
      ...localDevice,
      registeredUserId: undefined,
      lastSyncedAt: undefined,
      updatedAt: new Date().toISOString(),
    });
  }
}

async function saveLocalPushDeviceAsync(device: LocalPushDevice) {
  await AsyncStorage.setItem(PUSH_DEVICE_STORAGE_KEY, JSON.stringify(device));
}

async function ensureAndroidNotificationChannelAsync() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(DEFAULT_ANDROID_CHANNEL_ID, {
    name: 'General',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function getNotificationPermissionsAsync() {
  try {
    return await Notifications.getPermissionsAsync();
  } catch {
    return undefined;
  }
}

function getExpoProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra || {};
  const projectId =
    extra.eas?.projectId ||
    (Constants as any).easConfig?.projectId;
  return typeof projectId === 'string' && projectId.trim() ? projectId.trim() : undefined;
}

function getDeviceMetadata(): Omit<LocalPushDevice, 'deviceId' | 'expoPushToken' | 'updatedAt'> {
  return {
    platform: Platform.OS,
    appVersion: Constants.expoConfig?.version || Constants.nativeAppVersion || undefined,
    buildVersion: Constants.nativeBuildVersion || undefined,
    deviceName: Device.deviceName || undefined,
    osName: Device.osName || undefined,
    osVersion: Device.osVersion || undefined,
  };
}

function createLocalDeviceId() {
  return [
    'luva',
    Date.now().toString(36),
    Math.random().toString(36).slice(2, 10),
    Math.random().toString(36).slice(2, 10),
  ].join('-');
}

function formatPushError(err: any) {
  const message = typeof err?.message === 'string' ? err.message : String(err || 'unknown');
  return message.slice(0, 180);
}
