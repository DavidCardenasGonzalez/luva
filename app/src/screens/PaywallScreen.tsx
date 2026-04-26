import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { RouteProp } from "@react-navigation/native";
import Purchases, {
  PurchasesOfferings,
  PurchasesPackage,
} from "react-native-purchases";
import { MaterialIcons } from "@expo/vector-icons";
import { useRevenueCat } from "../purchases/RevenueCatProvider";
import { useCoins } from "../purchases/CoinBalanceProvider";
import CoinCountChip from "../components/CoinCountChip";
import { RootStackParamList } from "../navigation/AppNavigator";
import {
  requestMetaTrackingPermissionIfNeeded,
  trackCheckoutInitiated,
  trackPaywallViewed,
  trackSubscriptionPurchased,
} from "../marketing/metaAppEvents";
import {
  trackMixpanelPaywallViewed,
  trackMixpanelPremiumActivated,
} from "../marketing/mixpanelEvents";

const COLORS = {
  bg: "#050b1a",
  card: "#0b1224",
  border: "#111827",
  text: "#e2e8f0",
  muted: "#94a3b8",
  accent: "#22d3ee",
  accent2: "#0ea5e9",
  success: "#22c55e",
};

type PackageInfo = {
  pkg: PurchasesPackage;
  price: string;
  title: string;
  periodLabel?: string;
  cadenceLabel?: string;
  isRecommended: boolean;
};

export default function PaywallScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, "Paywall">>();
  const insets = useSafeAreaInsets();
  const isModal = !!route.params?.asModal;
  const paywallSource = route.params?.source || "unknown";
  const paywallVariant = route.params?.variant || "pro";
  const isLitePaywall = paywallVariant === "lite";
  const { isPro, refreshCustomerInfo, loading: rcLoading } = useRevenueCat();
  const {
    balance: coinBalance,
    maxCoins,
    isUnlimited,
    loading: coinsLoading,
  } = useCoins();
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trackedPaywallRef = useRef(false);

  const openExternal = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.warn("[Paywall] No se pudo abrir el enlace", err);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isLitePaywall) {
          if (mounted) setOfferings(null);
          return;
        }
        const res = await Purchases.getOfferings();
        if (mounted) setOfferings(res);
      } catch (err: any) {
        console.warn("[Paywall] No se pudo cargar offerings", err);
        if (mounted) setError(err?.message || "No pudimos cargar las ofertas.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [isLitePaywall]);

  useEffect(() => {
    if (!isLitePaywall && isPro && !rcLoading) {
      Alert.alert("Suscripción activa", "Ya tienes acceso Pro.");
      navigation.goBack();
    }
  }, [isLitePaywall, isPro, rcLoading, navigation]);

  useEffect(() => {
    if (trackedPaywallRef.current || (!isLitePaywall && isPro) || coinsLoading) {
      return;
    }
    trackedPaywallRef.current = true;
    void requestMetaTrackingPermissionIfNeeded();
    void trackPaywallViewed({ source: paywallSource, asModal: isModal });
    void trackMixpanelPaywallViewed({
      source: paywallSource,
      asModal: isModal,
      coinBalance,
      maxCoins,
      isUnlimited,
    });
  }, [
    coinBalance,
    coinsLoading,
    isModal,
    isLitePaywall,
    isPro,
    isUnlimited,
    maxCoins,
    paywallSource,
  ]);

  const availablePackages = useMemo<PackageInfo[]>(() => {
    const current = offerings?.current;
    const all = current?.availablePackages || [];
    return all.map((pkg) => {
      const { product } = pkg;
      const title =
        product.subscriptionPeriod === "P1M"
          ? "Plan mensual"
          : product.subscriptionPeriod === "P1Y"
            ? "Plan anual"
            : product.title || pkg.identifier;
      let periodLabel: string | undefined;
      let cadenceLabel: string | undefined;
      let isRecommended = false;
      if (product.subscriptionPeriod === "P1M") {
        periodLabel = "Facturado cada mes";
        cadenceLabel = "mes";
      } else if (product.subscriptionPeriod === "P1Y") {
        periodLabel = "Facturado cada año";
        cadenceLabel = "año";
        isRecommended = true;
      }
      return {
        pkg,
        price: product.priceString,
        title,
        periodLabel,
        cadenceLabel,
        isRecommended,
      };
    });
  }, [offerings]);

  const handlePurchase = async (info: PackageInfo) => {
    setProcessingId(info.pkg.identifier);
    setError(null);
    try {
      void trackCheckoutInitiated({
        source: paywallSource,
        packageId: info.pkg.identifier,
        productId: info.pkg.product.identifier,
        price: info.pkg.product.price,
        priceString: info.pkg.product.priceString,
        currency: info.pkg.product.currencyCode,
        subscriptionPeriod: info.pkg.product.subscriptionPeriod,
        hasIntroOffer: Boolean(info.pkg.product.introPrice),
      });
      const res = await Purchases.purchasePackage(info.pkg);
      if (res.customerInfo) {
        const entitlement = Object.values(
          res.customerInfo.entitlements.active || {}
        )[0];
        void trackSubscriptionPurchased({
          source: paywallSource,
          packageId: info.pkg.identifier,
          productId: info.pkg.product.identifier,
          price: info.pkg.product.price,
          priceString: info.pkg.product.priceString,
          currency: info.pkg.product.currencyCode,
          subscriptionPeriod: info.pkg.product.subscriptionPeriod,
          hasIntroOffer: Boolean(info.pkg.product.introPrice),
        });
        void trackMixpanelPremiumActivated({
          premiumSource: "subscription",
          paywallSource,
          packageId: info.pkg.identifier,
          productId: info.pkg.product.identifier,
          price: info.pkg.product.price,
          priceString: info.pkg.product.priceString,
          currency: info.pkg.product.currencyCode,
          subscriptionPeriod: info.pkg.product.subscriptionPeriod,
          hasIntroOffer: Boolean(info.pkg.product.introPrice),
          expiresAt: entitlement?.expirationDate || null,
        });
        await refreshCustomerInfo();
        Alert.alert("¡Listo!", "Ya eres Pro. Disfruta monedas ilimitadas.");
        navigation.goBack();
      }
    } catch (err: any) {
      if (!err?.userCancelled) {
        console.warn("[Paywall] Error al comprar", err);
        setError(err?.message || "No pudimos completar la compra.");
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    setError(null);
    try {
      const res = await Purchases.restorePurchases();
      if (res) {
        const entitlement = Object.values(res.entitlements.active || {})[0];
        if (entitlement) {
          void trackMixpanelPremiumActivated({
            premiumSource: "restore",
            paywallSource,
            productId: entitlement.productIdentifier,
            expiresAt: entitlement.expirationDate || null,
          });
        }
        await refreshCustomerInfo();
        Alert.alert("Restaurado", "Tus compras fueron restauradas.");
        navigation.goBack();
      }
    } catch (err: any) {
      console.warn("[Paywall] Error al restaurar", err);
      setError(err?.message || "No pudimos restaurar las compras.");
    } finally {
      setRestoring(false);
    }
  };

  const renderPackageCard = (info: PackageInfo, idx: number) => {
    const isRecommended = info.isRecommended;
    const processing = processingId === info.pkg.identifier;
    return (
      <Pressable
        key={info.pkg.identifier}
        onPress={() => void handlePurchase(info)}
        disabled={processing}
        style={({ pressed }) => ({
          marginBottom: 12,
          padding: 16,
          borderRadius: 18,
          backgroundColor: "#0f172a",
          borderWidth: 1,
          borderColor: isRecommended ? COLORS.accent : COLORS.border,
          opacity: pressed || processing ? 0.9 : 1,
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowRadius: 10,
        })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ color: COLORS.text, fontSize: 17, fontWeight: "800" }}>{info.title}</Text>
            <Text style={{ color: COLORS.muted, marginTop: 4, fontSize: 13 }}>
              {info.periodLabel || "Acceso ilimitado y monedas infinitas"}
            </Text>
          </View>
          {isRecommended ? (
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: "rgba(34, 211, 238, 0.16)",
                borderWidth: 1,
                borderColor: COLORS.accent,
              }}
            >
              <Text style={{ color: COLORS.accent, fontWeight: "800", fontSize: 12 }}>Recomendado</Text>
            </View>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 10 }}>
          <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: "900" }}>{info.price}</Text>
          {info.cadenceLabel ? (
            <Text style={{ color: COLORS.muted, fontSize: 16, fontWeight: "800", marginLeft: 4 }}>
              /{info.cadenceLabel}
            </Text>
          ) : null}
        </View>
        {/* <Text style={{ color: "#cbd5e1", marginTop: 12, fontWeight: "700" }}>
          • Monedas ilimitadas y sin esperas
        </Text>
        <Text style={{ color: "#cbd5e1", marginTop: 6 }}>
          • Acceso completo a misiones y cartas sin consumos
        </Text>
        <Text style={{ color: "#cbd5e1", marginTop: 6 }}>
          • Soporte prioritario y mejoras futuras
        </Text> */}
        {processing ? (
          <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center" }}>
            <ActivityIndicator color={COLORS.accent} />
            <Text style={{ color: COLORS.muted, marginLeft: 8 }}>Procesando compra...</Text>
          </View>
        ) : (
          <Text style={{ color: COLORS.accent, marginTop: 10, fontWeight: "800" }}>
            Tocar para continuar con {info.price}
          </Text>
        )}
      </Pressable>
    );
  };

  const handleLitePurchase = () => {
    Alert.alert(
      "Versión Lite",
      "Esta oferta todavía está hardcodeada. Configura el producto en la tienda para activar la compra."
    );
  };

  const renderLitePackageCard = () => (
    <Pressable
      onPress={handleLitePurchase}
      style={({ pressed }) => ({
        marginBottom: 12,
        padding: 16,
        borderRadius: 18,
        backgroundColor: "#0f172a",
        borderWidth: 1,
        borderColor: COLORS.accent,
        opacity: pressed ? 0.9 : 1,
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 10,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={{ color: COLORS.text, fontSize: 17, fontWeight: "800" }}>Versión Lite</Text>
          <Text style={{ color: COLORS.muted, marginTop: 4, fontSize: 13 }}>
            Misiones Ilimitadas
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 10 }}>
        <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: "900" }}>$29.99</Text>
        <Text style={{ color: COLORS.muted, fontSize: 16, fontWeight: "800", marginLeft: 4 }}>
          USD
        </Text>
      </View>
      <Text style={{ color: COLORS.accent, marginTop: 10, fontWeight: "800" }}>
        Tocar para continuar con $29.99 USD
      </Text>
    </Pressable>
  );

  const content = (
    <View style={{ flex: 1 }}>
      <View style={{ position: "absolute", top: -80, right: -60, width: 260, height: 260, borderRadius: 200, backgroundColor: "#0ea5e91b" }} />
      <View style={{ position: "absolute", bottom: -120, left: -80, width: 320, height: 320, borderRadius: 280, backgroundColor: "#22c55e22" }} />
      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: COLORS.card,
              borderWidth: 1,
              borderColor: COLORS.border,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <MaterialIcons name="chevron-left" size={26} color={COLORS.text} />
          </Pressable>
          <CoinCountChip />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 20,
            padding: 18,
            borderWidth: 1,
            borderColor: COLORS.border,
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 12,
          }}
        >
          <Text style={{ color: COLORS.accent2, fontSize: 12, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" }}>
            {isLitePaywall ? "Versión Lite" : "Hazte Pro"}
          </Text>
          <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: "900", marginTop: 6 }}>
            {isLitePaywall ? "Versión Lite" : "Monedas ilimitadas y acceso completo"}
          </Text>
          <Text style={{ color: COLORS.muted, marginTop: 8, lineHeight: 20 }}>
            {isLitePaywall
              ? "Accede a misiones ilimitadas con un pago fijo de $29.99 USD."
              : "Verás los precios en tu moneda local y podrás restaurar tus compras cuando quieras."}
          </Text>
          <View style={{ marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {(isLitePaywall
              ? ["Misiones Ilimitadas"]
              : [
                  "Misiones y cartas ilimitadas sin esperar regeneración",
                  "Uso ilimitado de escritura por voz",
                  "Acceso a nuestra plataforma web",
                ]
            ).map((item) => (
              <View
                key={item}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: "#0b152b",
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Text style={{ color: COLORS.text, fontWeight: "700" }}>✓</Text>
                <Text style={{ color: COLORS.muted, marginLeft: 6, fontWeight: "600" }}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          {isLitePaywall ? (
            renderLitePackageCard()
          ) : loading || rcLoading ? (
            <View style={{ padding: 16, borderRadius: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" }}>
              <ActivityIndicator color={COLORS.accent} />
              <Text style={{ color: COLORS.muted, marginTop: 8 }}>Cargando ofertas...</Text>
            </View>
          ) : availablePackages.length ? (
            availablePackages.map(renderPackageCard)
          ) : (
            <View style={{ padding: 16, borderRadius: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border }}>
              <Text style={{ color: COLORS.text, fontWeight: "800" }}>No hay ofertas disponibles.</Text>
              <Text style={{ color: COLORS.muted, marginTop: 6 }}>
                Intenta actualizar en unos minutos o revisa tu conexión.
              </Text>
            </View>
          )}
        </View>

        <View
          style={{
            marginTop: 10,
            padding: 12,
            borderRadius: 14,
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text style={{ color: COLORS.muted, fontSize: 12, lineHeight: 18 }}>
            Auto-renewable subscription. Cancel anytime.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8, gap: 12 }}>
            <Pressable onPress={() => openExternal("https://www.luvaenglish.com/#privacidad")}>
              <Text style={{ color: COLORS.accent2, fontWeight: "700" }}>Política de privacidad</Text>
            </Pressable>
            <Pressable onPress={() => openExternal("https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")}>
              <Text style={{ color: COLORS.accent2, fontWeight: "700" }}>Términos y condiciones</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ marginTop: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Pressable
            onPress={handleRestore}
            disabled={restoring}
            style={({ pressed }) => ({
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: pressed ? "#0b152b" : COLORS.card,
              opacity: restoring ? 0.7 : 1,
            })}
          >
            <Text style={{ color: COLORS.text, fontWeight: "700" }}>
              {restoring ? "Restaurando..." : "Restaurar compras"}
            </Text>
          </Pressable>
          {error ? <Text style={{ color: "#fca5a5", flex: 1, marginLeft: 10 }}>{error}</Text> : null}
        </View>
      </ScrollView>
    </View>
  );

  if (isModal) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}
      >
        <View
          style={{
            flex: 1,
            paddingTop: insets.top + 12,
            paddingHorizontal: 12,
            paddingBottom: Math.max(insets.bottom, 12),
          }}
        >
          <View
            style={{
              flex: 1,
              borderRadius: 20,
              overflow: "hidden",
              backgroundColor: COLORS.bg,
              borderWidth: 1,
              borderColor: COLORS.border,
              shadowColor: "#000",
              shadowOpacity: 0.25,
              shadowRadius: 16,
            }}
          >
            {content}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {content}
    </SafeAreaView>
  );
}
