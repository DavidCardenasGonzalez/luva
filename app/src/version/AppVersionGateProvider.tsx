import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Modal, Platform, Pressable, Text, View } from 'react-native';
import { api } from '../api/api';
import { getRuntimeAppVersion } from './appVersion';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

type VersionCheckStatus = 'ok' | 'optional_update' | 'required_update';

type VersionCheckResponse = {
  status: VersionCheckStatus;
  force: boolean;
  title: string;
  message: string;
  currentVersion: string;
  latestVersion: string;
  recommendedMinimumVersion: string;
  minimumSupportedVersion: string;
  storeUrl: string;
  urls?: {
    ios?: string;
    android?: string;
    fallback?: string;
  };
};

function resolveStoreUrl(payload: VersionCheckResponse | null): string {
  if (!payload) return '';
  if (Platform.OS === 'ios') {
    return payload.urls?.ios || payload.storeUrl || payload.urls?.fallback || '';
  }
  if (Platform.OS === 'android') {
    return payload.urls?.android || payload.storeUrl || payload.urls?.fallback || '';
  }
  return payload.urls?.fallback || payload.storeUrl || payload.urls?.android || payload.urls?.ios || '';
}

export function AppVersionGateProvider({ children }: { children: React.ReactNode }) {
  const [checkResult, setCheckResult] = useState<VersionCheckResponse | null>(null);
  const [dismissedOptional, setDismissedOptional] = useState(false);
  const [openingStore, setOpeningStore] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkVersion = async () => {
      try {
        console.log('[VersionGate] Iniciando verificación de versión', getRuntimeAppVersion());
        const payload = await api.post<VersionCheckResponse>('/app/version-check', {
          version: getRuntimeAppVersion(),
          platform: Platform.OS,
        });
        if (!mounted) return;
        console.log('[VersionGate] Resultado de la verificación de versión', payload);
        setCheckResult(payload);
        setDismissedOptional(false);
      } catch (err) {
        console.warn('[VersionGate] No se pudo validar versión', err);
      }
    };

    void checkVersion();

    return () => {
      mounted = false;
    };
  }, []);

  const requiresUpdate = checkResult?.status === 'required_update' || checkResult?.force === true;
  const hasOptionalUpdate = checkResult?.status === 'optional_update' && !dismissedOptional;
  const isVisible = requiresUpdate || hasOptionalUpdate;
  const storeUrl = useMemo(() => resolveStoreUrl(checkResult), [checkResult]);

  const openStore = useCallback(async () => {
    if (!storeUrl || openingStore) return;
    try {
      setOpeningStore(true);
      const supported = await Linking.canOpenURL(storeUrl);
      if (!supported) {
        throw new Error('STORE_URL_UNSUPPORTED');
      }
      await Linking.openURL(storeUrl);
    } catch (err) {
      console.warn('[VersionGate] No se pudo abrir la tienda', err);
      Alert.alert('No se pudo abrir la tienda', 'Abre App Store o Google Play y busca Luva para actualizar.');
    } finally {
      setOpeningStore(false);
    }
  }, [openingStore, storeUrl]);

  const closeOptional = useCallback(() => {
    if (requiresUpdate) return;
    setDismissedOptional(true);
  }, [requiresUpdate]);

  return (
    <>
      {children}
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={requiresUpdate ? () => {} : closeOptional}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(2, 6, 23, 0.78)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              borderRadius: 20,
              backgroundColor: '#0f172a',
              borderWidth: 1,
              borderColor: '#1e293b',
              padding: 20,
            }}
          >
            <Text style={{ color: '#e2e8f0', fontSize: 22, fontWeight: '800' }}>
              {checkResult?.title || 'Hay una nueva versión'}
            </Text>
            <Text style={{ color: '#94a3b8', marginTop: 8, lineHeight: 20 }}>
              {checkResult?.message || 'Actualiza la app para continuar con la mejor experiencia.'}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 14 }}>
              Tu versión: {checkResult?.currentVersion || getRuntimeAppVersion()} · Última: {checkResult?.latestVersion || '-'}
            </Text>

            <View style={{ flexDirection: 'row', marginTop: 18 }}>
              {!requiresUpdate ? (
                <Pressable
                  onPress={closeOptional}
                  style={({ pressed }) => ({
                    flex: 1,
                    marginRight: 8,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#334155',
                    paddingVertical: 12,
                    alignItems: 'center',
                    backgroundColor: pressed ? '#111827' : '#0b1224',
                  })}
                >
                  <Text style={{ color: '#cbd5e1', fontWeight: '700' }}>Más tarde</Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={openStore}
                style={({ pressed }) => ({
                  flex: 1,
                  marginLeft: requiresUpdate ? 0 : 8,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                  backgroundColor: pressed ? '#047857' : '#059669',
                })}
              >
                <Text style={{ color: '#ecfeff', fontWeight: '800' }}>
                  {openingStore ? 'Abriendo tienda...' : 'Actualizar ahora'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
