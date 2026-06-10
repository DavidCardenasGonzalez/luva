import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const banner = require('./banner.png');

const COLORS = {
  background: '#030617',
  text: '#f8fafc',
  muted: '#cbd5e1',
  soft: '#94a3b8',
  purple: '#7c3aed',
  violet: '#a855f7',
  cyan: '#22d3ee',
  pink: '#fb3d8b',
  card: 'rgba(12, 18, 39, 0.86)',
  cardBorder: 'rgba(168, 85, 247, 0.52)',
};

export type PromoPaywallProduct = {
  id?: string;
  title: string;
  price: string;
  currencyCode?: string;
  originalPrice?: string;
  monthlyEquivalent?: string;
  billingDetails?: string;
  priceSuffix?: string;
  optionLabel?: string;
  badgeLabel?: string;
  description?: string;
};

type Props = {
  mode?: 'promo' | 'pro';
  remainingSeconds: number;
  product?: PromoPaywallProduct;
  products?: PromoPaywallProduct[];
  selectedProductId?: string;
  loading: boolean;
  processing: boolean;
  restoring: boolean;
  expired: boolean;
  error: string | null;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  helperText?: string;
  rewardAdLabel?: string;
  rewardAdHelperText?: string;
  rewardAdProcessing?: boolean;
  rewardAdError?: string | null;
  onClose: () => void;
  onPurchase: () => void;
  onRewardAdPress?: () => void;
  onSelectProduct?: (productId: string) => void;
  onRestore: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function getTimerParts(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return { hours: pad(hours), minutes: pad(minutes), seconds: pad(seconds) };
}

const BENEFITS = [
  'Acceso ilimitado a todas las funciones (sin usar monedas)',
  'Chats con avatares IA sin límites',
  'Lecciones completas sin restricciones',
  'Shadowing ilimitado en todos los capítulos',
  'Sin publicidad',
];

export default function Step7({
  mode = 'promo',
  remainingSeconds,
  product,
  products = [],
  selectedProductId,
  loading,
  processing,
  restoring,
  expired,
  error,
  title,
  subtitle,
  ctaLabel,
  helperText,
  rewardAdLabel,
  rewardAdHelperText,
  rewardAdProcessing,
  rewardAdError,
  onClose,
  onPurchase,
  onRewardAdPress,
  onSelectProduct,
  onRestore,
  onOpenPrivacy,
  onOpenTerms,
}: Props) {
  const { width } = useWindowDimensions();
  const isPromo = mode === 'promo';
  const timer = getTimerParts(remainingSeconds);
  const bannerHeight = width * 0.67;
  const disabled = loading || processing || expired || !product;
  const productDetails = product?.billingDetails || product?.monthlyEquivalent;
  const titleText = title || (isPromo ? '50% de descuento' : 'Obtén acceso ilimitado con el plan Pro');
  const subtitleText = subtitle || (isPromo ? 'por tiempo limitado' : 'Elige cómo quieres pagar');
  const buttonText = ctaLabel || (isPromo ? 'Empezar Gratis' : 'Continuar con Pro');
  const loadingText = isPromo ? 'Cargando oferta...' : 'Cargando planes...';
  const footerText =
    helperText ||
    (isPromo ? '7 días de garantía · Cancela cuando quieras' : 'Suscripción autorrenovable · Cancela cuando quieras');
  const showProductSwitch = !isPromo && products.length > 1 && Boolean(selectedProductId && onSelectProduct);
  const showRewardAd = !isPromo && Boolean(onRewardAdPress && rewardAdLabel);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 22 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={isPromo ? 'Cerrar promoción' : 'Cerrar paywall'}
            style={({ pressed }) => ({
              width: 38,
              height: 38,
              borderRadius: 19,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.10)',
            })}
          >
            <MaterialIcons name="close" size={20} color={COLORS.text} />
          </Pressable>

          <Pressable
            onPress={onRestore}
            disabled={restoring}
            accessibilityRole="button"
            accessibilityLabel="Restaurar compras"
            style={({ pressed }) => ({
              opacity: pressed || restoring ? 0.65 : 1,
              paddingHorizontal: 6,
              paddingVertical: 6,
            })}
          >
            <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '800' }}>
              {restoring ? 'Restaurando...' : 'Restaurar compras'}
            </Text>
          </Pressable>
        </View>

        <View style={{ alignItems: 'center', marginTop: 6 }}>
          {/* <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 7,
              borderRadius: 999,
              backgroundColor: 'rgba(88, 28, 135, 0.72)',
              borderWidth: 1,
              borderColor: 'rgba(168, 85, 247, 0.54)',
            }}
          >
            <Text style={{ color: '#ddd6fe', fontSize: 11, fontWeight: '900', letterSpacing: 0.4 }}>
              OFERTA DE BIENVENIDA
            </Text>
          </View> */}

          <Text
            style={{
              color: '#c4b5fd',
              fontSize: isPromo ? 39 : 32,
              fontWeight: '900',
              lineHeight: isPromo ? 44 : 37,
              marginTop: 10,
              textAlign: 'center',
            }}
          >
            {titleText}
          </Text>
          <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '900', textAlign: 'center' }}>
            {subtitleText}
          </Text>
        </View>

        {isPromo ? (
          <View
            style={{
              marginTop: 18,
              borderRadius: 22,
              padding: 13,
              borderWidth: 1,
              borderColor: expired ? 'rgba(148, 163, 184, 0.24)' : 'rgba(251, 61, 139, 0.54)',
              backgroundColor: 'rgba(15, 23, 42, 0.70)',
              shadowColor: COLORS.pink,
              shadowOpacity: expired ? 0 : 0.32,
              shadowRadius: 18,
            }}
          >
            <Text style={{ color: expired ? COLORS.soft : '#fb7185', fontSize: 10, fontWeight: '900' }}>
              {expired ? 'Esta oferta expiró' : 'Esta oferta expira en:'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <TimerUnit value={timer.hours} label="HORAS" />
              <TimerSeparator />
              <TimerUnit value={timer.minutes} label="MINUTOS" />
              <TimerSeparator />
              <TimerUnit value={timer.seconds} label="SEGUNDOS" />
            </View>
          </View>
        ) : null}

        <View
          style={{
            height: bannerHeight,
            marginHorizontal: -20,
            marginTop: isPromo ? 8 : 12,
          }}
        >
          <Image
            source={banner}
            resizeMode="contain"
            style={{ width, height: bannerHeight }}
          />
        </View>

        <View
          style={{
            borderRadius: 24,
            borderWidth: 1,
            borderColor: COLORS.cardBorder,
            backgroundColor: COLORS.card,
            padding: 18,
            marginTop: -8,
            shadowColor: COLORS.violet,
            shadowOpacity: 0.28,
            shadowRadius: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 9,
                backgroundColor: 'rgba(124, 58, 237, 0.9)',
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '900' }}>
                {product?.badgeLabel || (isPromo ? 'MEJOR VALOR' : 'PLAN PRO')}
              </Text>
            </View>
            {product?.originalPrice ? (
              <Text
                style={{
                  color: COLORS.soft,
                  fontSize: 12,
                  textDecorationLine: 'line-through',
                  textDecorationColor: COLORS.soft,
                }}
              >
                {product.originalPrice}
              </Text>
            ) : null}
          </View>

          {showProductSwitch ? (
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: 'rgba(3, 7, 18, 0.72)',
                borderRadius: 16,
                padding: 4,
                marginTop: 14,
                borderWidth: 1,
                borderColor: 'rgba(168, 85, 247, 0.28)',
              }}
            >
              {products.map((option) => {
                const optionId = option.id || option.title;
                const selected = optionId === selectedProductId;
                return (
                  <Pressable
                    key={optionId}
                    onPress={() => onSelectProduct?.(optionId)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => ({
                      flex: 1,
                      minHeight: 42,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selected ? 'rgba(124, 58, 237, 0.96)' : 'transparent',
                      opacity: pressed ? 0.78 : 1,
                    })}
                  >
                    <Text
                      style={{
                        color: selected ? '#ffffff' : COLORS.muted,
                        fontSize: 13,
                        fontWeight: '900',
                      }}
                    >
                      {option.optionLabel || option.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: 'rgba(124, 58, 237, 0.26)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 11,
              }}
            >
              <MaterialIcons name="workspace-premium" size={24} color="#c4b5fd" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.text, fontSize: 17, fontWeight: '900' }}>
                {product?.title || 'Plan Anual'}
              </Text>
              <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
                {product?.description || 'Acceso completo a todo Luva'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: '900', lineHeight: 31 }}>
                  {product?.price || '--'}
                </Text>
                {product?.currencyCode ? (
                  <Text style={{ color: COLORS.text, fontSize: 12, fontWeight: '900', marginLeft: 4, marginBottom: 3 }}>
                    {product.currencyCode}
                  </Text>
                ) : null}
                {product?.priceSuffix ? (
                  <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '900', marginLeft: 3, marginBottom: 3 }}>
                    /{product.priceSuffix}
                  </Text>
                ) : null}
              </View>
              {productDetails ? (
                <Text
                  style={{
                    color: '#ddd6fe',
                    fontSize: 10,
                    fontWeight: '800',
                    backgroundColor: 'rgba(124, 58, 237, 0.44)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 999,
                    marginTop: 5,
                  }}
                >
                  {productDetails}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={{ marginTop: 15, gap: 8 }}>
            {BENEFITS.map((benefit) => (
              <View key={benefit} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="check" size={17} color="#a78bfa" />
                <Text style={{ color: COLORS.muted, fontSize: 12, marginLeft: 9, fontWeight: '700' }}>
                  {benefit}
                </Text>
              </View>
            ))}
          </View>

          {error ? (
            <Text style={{ color: '#fca5a5', fontSize: 12, lineHeight: 17, marginTop: 12 }}>
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={onPurchase}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={buttonText}
            style={({ pressed }) => ({
              minHeight: 58,
              borderRadius: 17,
              marginTop: 17,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 10,
              backgroundColor: disabled
                ? 'rgba(71, 85, 105, 0.72)'
                : pressed
                  ? '#5b21b6'
                  : COLORS.purple,
              opacity: pressed || processing ? 0.9 : 1,
            })}
          >
            {processing || loading ? <ActivityIndicator color="#ffffff" /> : null}
            <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '900' }}>
              {expired
                ? 'Oferta expirada'
                : loading
                  ? loadingText
                  : processing
                    ? 'Procesando...'
                    : buttonText}
            </Text>
            {!processing && !loading && !expired ? (
              <MaterialIcons name="arrow-forward" size={24} color="#ffffff" />
            ) : null}
          </Pressable>

          <Text style={{ color: COLORS.soft, fontSize: 11, lineHeight: 16, marginTop: 10, textAlign: 'center' }}>
            {footerText}
          </Text>
        </View>

        {showRewardAd ? (
          <View style={{ marginTop: 14 }}>
            <Pressable
              onPress={onRewardAdPress}
              disabled={Boolean(rewardAdProcessing)}
              accessibilityRole="button"
              accessibilityLabel={rewardAdLabel}
              style={({ pressed }) => ({
                minHeight: 52,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(34, 211, 238, 0.42)',
                backgroundColor: pressed
                  ? 'rgba(8, 145, 178, 0.26)'
                  : 'rgba(8, 47, 73, 0.52)',
                opacity: pressed || rewardAdProcessing ? 0.82 : 1,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 9,
              })}
            >
              {rewardAdProcessing ? (
                <ActivityIndicator color={COLORS.cyan} />
              ) : (
                <MaterialIcons name="play-circle-outline" size={22} color={COLORS.cyan} />
              )}
              <Text style={{ color: '#e0faff', fontSize: 15, fontWeight: '900' }}>
                {rewardAdProcessing ? 'Cargando anuncio...' : rewardAdLabel}
              </Text>
            </Pressable>
            {rewardAdError ? (
              <Text style={{ color: '#fca5a5', fontSize: 12, lineHeight: 17, marginTop: 8, textAlign: 'center' }}>
                {rewardAdError}
              </Text>
            ) : rewardAdHelperText ? (
              <Text style={{ color: COLORS.soft, fontSize: 11, lineHeight: 16, marginTop: 8, textAlign: 'center' }}>
                {rewardAdHelperText}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <Text style={{ color: COLORS.soft, fontSize: 11 }}>
            Pago seguro a través de App Store
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <Pressable onPress={onOpenTerms}>
              <Text style={{ color: COLORS.soft, fontSize: 11, fontWeight: '700' }}>Términos de uso</Text>
            </Pressable>
            <Text style={{ color: 'rgba(148, 163, 184, 0.52)' }}>·</Text>
            <Pressable onPress={onOpenPrivacy}>
              <Text style={{ color: COLORS.soft, fontSize: 11, fontWeight: '700' }}>Política de privacidad</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function TimerUnit({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center', minWidth: 50 }}>
      <Text style={{ color: '#fb7185', fontSize: 25, fontWeight: '900', lineHeight: 29 }}>
        {value}
      </Text>
      <Text style={{ color: '#fda4af', fontSize: 8, fontWeight: '900' }}>
        {label}
      </Text>
    </View>
  );
}

function TimerSeparator() {
  return (
    <Text style={{ color: '#fb7185', fontSize: 22, fontWeight: '900', marginBottom: 10 }}>
      :
    </Text>
  );
}
