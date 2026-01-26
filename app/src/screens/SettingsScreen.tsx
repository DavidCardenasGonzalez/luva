import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import Purchases from 'react-native-purchases';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useRevenueCat } from '../purchases/RevenueCatProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { isPro, customerInfo, loading: rcLoading } = useRevenueCat();

  const proInfo = useMemo(() => {
    const entitlement = customerInfo?.entitlements?.active
      ? Object.values(customerInfo.entitlements.active)[0]
      : undefined;
    if (!entitlement) return null;
    return {
      productId: entitlement.productIdentifier,
      expirationDate: entitlement.expirationDate || null,
    };
  }, [customerInfo]);

  const openExternal = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.warn('No se pudo abrir el enlace', err);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return 'Sin fecha de expiración';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: '#0b1224' }}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => ({
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: '#0f172a',
              borderWidth: 1,
              borderColor: '#1f2937',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              opacity: pressed ? 0.9 : 1,
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 8,
            })}
          >
            <MaterialIcons name="arrow-back" size={20} color="#e2e8f0" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#e2e8f0', fontSize: 22, fontWeight: '800' }}>Configuración</Text>
            <Text style={{ color: '#94a3b8', marginTop: 2 }}>Ajusta tu experiencia en Luva.</Text>
          </View>
        </View>

        <View
          style={{
            borderRadius: 20,
            padding: 18,
            backgroundColor: '#0b172a',
            borderWidth: 1,
            borderColor: '#1f2937',
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 8,
          }}
        >
          <Text style={{ color: '#a5f3fc', fontSize: 12, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' }}>
            Sobre Luva
          </Text>
          <Text style={{ color: '#e2e8f0', fontSize: 18, fontWeight: '800', marginTop: 6 }}>
            Comunidad y soporte
          </Text>
          <Text style={{ color: '#94a3b8', marginTop: 6, lineHeight: 20 }}>
            Si notas algo raro o tienes una idea, comparte feedback para seguir mejorando.
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 10 }}>
            <View
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                backgroundColor: '#0b172b',
                borderWidth: 1,
                borderColor: '#1e293b',
              }}
            >
              <Text style={{ color: '#cbd5e1', fontWeight: '700', fontSize: 12 }}>Soporte</Text>
              <Text style={{ color: '#e2e8f0', marginTop: 4 }}>dcardenasgz@gmail.com</Text>
            </View>
            <View
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                backgroundColor: '#0b172b',
                borderWidth: 1,
                borderColor: '#1e293b',
              }}
            >
              <Text style={{ color: '#cbd5e1', fontWeight: '700', fontSize: 12 }}>Versión</Text>
              <Text style={{ color: '#e2e8f0', marginTop: 4 }}>0.1.0</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={{ color: '#a5f3fc', fontSize: 12, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' }}>
              Suscripción
            </Text>
            {isPro ? (
              <View
                style={{
                  marginTop: 10,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: '#0b172b',
                  borderWidth: 1,
                  borderColor: '#1e293b',
                }}
              >
                <Text style={{ color: '#22c55e', fontWeight: '800' }}>Pro activo</Text>
                <Text style={{ color: '#e2e8f0', marginTop: 6 }}>
                  Plan: {proInfo?.productId || '—'}
                </Text>
                <Text style={{ color: '#94a3b8', marginTop: 4 }}>
                  Renovación: {formatDate(proInfo?.expirationDate)}
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 10 }}>
                  <Pressable
                    onPress={() => Purchases.showManageSubscriptions()}
                    style={({ pressed }) => ({
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: pressed ? '#0f172a' : '#0b152b',
                      borderWidth: 1,
                      borderColor: '#1e293b',
                    })}
                  >
                    <Text style={{ color: '#e2e8f0', fontWeight: '700' }}>Gestionar en la tienda</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                disabled={rcLoading}
                onPress={() => navigation.navigate('Paywall')}
                style={({ pressed }) => ({
                  marginTop: 10,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: rcLoading ? '#1f2937' : pressed ? '#2563eb' : '#3b82f6',
                  borderWidth: 1,
                  borderColor: '#1e3a8a',
                  opacity: rcLoading ? 0.7 : 1,
                })}
              >
                <Text style={{ color: 'white', fontWeight: '800', textAlign: 'center' }}>
                  {rcLoading ? 'Cargando...' : 'Hazte Pro'}
                </Text>
              </Pressable>
            )}
          </View>

          <View style={{ marginTop: 14 }}>
            <Pressable
              onPress={() => openExternal('https://d219zijgtsj7lu.cloudfront.net/#privacidad')}
              style={({ pressed }) => ({
                padding: 14,
                borderRadius: 14,
                backgroundColor: '#0b172b',
                borderWidth: 1,
                borderColor: '#1e293b',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <View>
                <Text style={{ color: '#e2e8f0', fontWeight: '700' }}>Política de privacidad</Text>
                <Text style={{ color: '#94a3b8', marginTop: 4, fontSize: 12 }}>Se abre en el navegador</Text>
              </View>
              <MaterialIcons name="open-in-new" size={18} color="#cbd5e1" />
            </Pressable>
            <Pressable
              onPress={() => openExternal('https://d219zijgtsj7lu.cloudfront.net/#terminos')}
              style={({ pressed }) => ({
                padding: 14,
                borderRadius: 14,
                backgroundColor: '#0b172b',
                borderWidth: 1,
                borderColor: '#1e293b',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <View>
                <Text style={{ color: '#e2e8f0', fontWeight: '700' }}>Términos y condiciones</Text>
                <Text style={{ color: '#94a3b8', marginTop: 4, fontSize: 12 }}>Se abre en el navegador</Text>
              </View>
              <MaterialIcons name="open-in-new" size={18} color="#cbd5e1" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
