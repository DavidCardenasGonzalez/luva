import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../auth/AuthProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { isSignedIn, signIn, signOut } = useAuth();

  const handleAuthAction = async () => {
    if (isSignedIn) {
      await signOut();
      return;
    }
    await signIn();
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
            backgroundColor: '#0f172a',
            borderWidth: 1,
            borderColor: '#1f2937',
            shadowColor: '#000',
            shadowOpacity: 0.14,
            shadowRadius: 12,
            marginBottom: 14,
          }}
        >
          <Text style={{ color: '#a5f3fc', fontSize: 12, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' }}>
            Cuenta
          </Text>
          <Text style={{ color: '#e2e8f0', fontSize: 18, fontWeight: '800', marginTop: 6 }}>
            Sesión y credenciales
          </Text>
          <Text style={{ color: '#94a3b8', marginTop: 6, lineHeight: 20 }}>
            Administra tu acceso y mantiene tu sesión segura desde aquí.
          </Text>

          <View
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 14,
              backgroundColor: '#0b172b',
              borderWidth: 1,
              borderColor: '#1e293b',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#cbd5e1', fontWeight: '700', fontSize: 12 }}>Estado</Text>
              <Text style={{ color: '#e2e8f0', fontWeight: '800', marginTop: 4 }}>
                {isSignedIn ? 'Sesión activa' : 'Sin iniciar sesión'}
              </Text>
              <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                {isSignedIn ? 'Puedes cerrar sesión cuando lo necesites.' : 'Inicia sesión para guardar tu progreso.'}
              </Text>
            </View>
            <Pressable
              onPress={handleAuthAction}
              style={({ pressed }) => ({
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: pressed ? '#2563eb' : '#3b82f6',
                shadowColor: '#3b82f6',
                shadowOpacity: 0.35,
                shadowRadius: 10,
              })}
            >
              <Text style={{ color: 'white', fontWeight: '800' }}>
                {isSignedIn ? 'Cerrar sesión' : 'Iniciar sesión'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View
          style={{
            borderRadius: 20,
            padding: 18,
            backgroundColor: '#0f172a',
            borderWidth: 1,
            borderColor: '#1f2937',
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 10,
            marginBottom: 14,
          }}
        >
          <Text style={{ color: '#a5f3fc', fontSize: 12, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' }}>
            Preferencias
          </Text>
          <Text style={{ color: '#e2e8f0', fontSize: 18, fontWeight: '800', marginTop: 6 }}>
            Experiencia personalizada
          </Text>
          <Text style={{ color: '#94a3b8', marginTop: 6, lineHeight: 20 }}>
            Ajustes sugeridos para que la app se sienta tuya. Más opciones llegarán pronto.
          </Text>

          <View style={{ marginTop: 14, gap: 10 }}>
            <View
              style={{
                padding: 12,
                borderRadius: 14,
                backgroundColor: '#0b172b',
                borderWidth: 1,
                borderColor: '#1e293b',
              }}
            >
              <Text style={{ color: '#e2e8f0', fontWeight: '700' }}>Idioma</Text>
              <Text style={{ color: '#94a3b8', marginTop: 4, fontSize: 12 }}>Español (más idiomas pronto)</Text>
            </View>
            <View
              style={{
                padding: 12,
                borderRadius: 14,
                backgroundColor: '#0b172b',
                borderWidth: 1,
                borderColor: '#1e293b',
              }}
            >
              <Text style={{ color: '#e2e8f0', fontWeight: '700' }}>Modo enfoque</Text>
              <Text style={{ color: '#94a3b8', marginTop: 4, fontSize: 12 }}>Silencia notificaciones durante la práctica.</Text>
              <Text style={{ color: '#475569', marginTop: 6, fontSize: 12 }}>Próximamente</Text>
            </View>
            <View
              style={{
                padding: 12,
                borderRadius: 14,
                backgroundColor: '#0b172b',
                borderWidth: 1,
                borderColor: '#1e293b',
              }}
            >
              <Text style={{ color: '#e2e8f0', fontWeight: '700' }}>Recordatorios</Text>
              <Text style={{ color: '#94a3b8', marginTop: 4, fontSize: 12 }}>
                Programa alertas para retomar historias o tarjetas.
              </Text>
              <Text style={{ color: '#475569', marginTop: 6, fontSize: 12 }}>Próximamente</Text>
            </View>
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
              <Text style={{ color: '#e2e8f0', marginTop: 4 }}>support@luva.app</Text>
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
