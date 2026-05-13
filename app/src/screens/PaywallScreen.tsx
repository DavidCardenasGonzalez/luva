import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  View,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { RouteProp } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Purchases, {
  PurchasesOfferings,
  PurchasesPackage,
} from "react-native-purchases";
import { useRevenueCat } from "../purchases/RevenueCatProvider";
import { useCoins } from "../purchases/CoinBalanceProvider";
import { RootStackParamList } from "../navigation/AppNavigator";
import {
  requestMetaTrackingPermissionIfNeeded,
  trackCheckoutInitiated,
  trackPaywallViewed,
  trackSubscriptionPurchased,
} from "../marketing/metaAppEvents";
import {
  trackMixpanelEvent,
  trackMixpanelPaywallViewed,
  trackMixpanelPremiumActivated,
} from "../marketing/mixpanelEvents";
import Step7, { PromoPaywallProduct } from "../onboarding/step-7/Step7";
import {
  LITE_PROMO_DURATION_MS,
  LITE_PROMO_EXPIRES_AT_KEY,
  LITE_PROMO_OFFERING_ID,
  LITE_PROMO_PACKAGE_ID,
  LITE_PROMO_PRODUCT_ID,
} from "../purchases/litePromo";

const COLORS = {
  bg: "#050b1a",
  border: "#111827",
};

const PRIVACY_URL = "https://www.luvaenglish.com/#privacidad";
const TERMS_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

type PackageInfo = {
  pkg: PurchasesPackage;
  price: string;
  priceAmount: number;
  productId: string;
  currencyCode?: string;
  subscriptionPeriod?: string | null;
  title: string;
  periodLabel?: string;
  cadenceLabel?: string;
  isRecommended: boolean;
};

function compactPriceString(price: string) {
  return price.replace(/([.,]00)(?!\d)/, "");
}

function withCurrencyCode(price: string, currencyCode?: string) {
  return `${price}${currencyCode ? ` ${currencyCode}` : ""}`;
}

function formatPriceAmount(amount: number, currencyCode?: string) {
  if (!Number.isFinite(amount)) return undefined;

  const roundedAmount = Math.round(amount * 100) / 100;
  const hasCents = Math.abs(roundedAmount - Math.round(roundedAmount)) > 0.001;

  if (currencyCode) {
    try {
      return compactPriceString(
        new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: currencyCode,
          currencyDisplay: "narrowSymbol",
          minimumFractionDigits: hasCents ? 2 : 0,
          maximumFractionDigits: hasCents ? 2 : 0,
        }).format(roundedAmount)
      );
    } catch {
      // Keep a simple fallback for unexpected currency codes from the store.
    }
  }

  return `$${roundedAmount.toFixed(hasCents ? 2 : 0)}`;
}

function formatMonthlyEquivalent(info: PackageInfo) {
  if (info.subscriptionPeriod !== "P1Y" || !Number.isFinite(info.priceAmount)) {
    return undefined;
  }

  const monthlyPrice = formatPriceAmount(info.priceAmount / 12, info.currencyCode);
  return monthlyPrice ? `Equivale a ${withCurrencyCode(monthlyPrice, info.currencyCode)}/mes` : undefined;
}

function buildProPaywallProduct(info: PackageInfo): PromoPaywallProduct {
  const isAnnual = info.subscriptionPeriod === "P1Y";
  const isMonthly = info.subscriptionPeriod === "P1M";
  const monthlyPrice = isAnnual ? formatPriceAmount(info.priceAmount / 12, info.currencyCode) : undefined;
  const billingDetails = isAnnual
    ? `Facturado anualmente · ${withCurrencyCode(info.price, info.currencyCode)}`
    : isMonthly
      ? `Facturado mensualmente · ${withCurrencyCode(info.price, info.currencyCode)}`
      : info.periodLabel;

  return {
    id: info.pkg.identifier,
    title: isAnnual ? "Plan anual" : isMonthly ? "Plan mensual" : info.title,
    optionLabel: isAnnual ? "Anual" : isMonthly ? "Mensual" : info.title,
    price: monthlyPrice || info.price,
    currencyCode: info.currencyCode,
    priceSuffix: isAnnual ? "mes" : info.cadenceLabel,
    badgeLabel: isAnnual ? "MEJOR VALOR" : isMonthly ? "MENSUAL" : "PLAN PRO",
    description: "Acceso completo a todo Luva",
    billingDetails,
  };
}

export default function PaywallScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, "Paywall">>();
  const insets = useSafeAreaInsets();
  const isModal = !!route.params?.asModal;
  const paywallSource = route.params?.source || "unknown";
  const requestedPaywallVariant = route.params?.variant || "pro";
  const closeTarget = route.params?.closeTarget;
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
  const [litePromoExpiresAt, setLitePromoExpiresAt] = useState<number | null>(null);
  const [litePromoCheckComplete, setLitePromoCheckComplete] = useState(requestedPaywallVariant === "lite");
  const [useLitePromoOverride, setUseLitePromoOverride] = useState(false);
  const [timerNow, setTimerNow] = useState(Date.now());
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<"annual" | "monthly">("annual");
  const trackedPaywallRef = useRef(false);
  const isLitePaywall = requestedPaywallVariant === "lite" || useLitePromoOverride;

  const dismissPaywall = useCallback(() => {
    if (closeTarget === "Feed") {
      navigation.reset({
        index: 0,
        routes: [{ name: "Feed" }],
      });
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("Feed");
  }, [closeTarget, navigation]);

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
  }, []);

  useEffect(() => {
    if (isPro && !rcLoading) {
      Alert.alert("Suscripción activa", "Ya tienes acceso Pro.");
      dismissPaywall();
    }
  }, [dismissPaywall, isPro, rcLoading]);

  useEffect(() => {
    let mounted = true;

    if (requestedPaywallVariant === "lite") {
      setUseLitePromoOverride(false);
      setLitePromoCheckComplete(true);
      return () => {
        mounted = false;
      };
    }

    setLitePromoCheckComplete(false);

    const resolveLitePromoOverride = async () => {
      const now = Date.now();
      try {
        const storedValue = await AsyncStorage.getItem(LITE_PROMO_EXPIRES_AT_KEY);
        const storedExpiresAt = storedValue ? Number(storedValue) : Number.NaN;

        if (Number.isFinite(storedExpiresAt) && storedExpiresAt > now) {
          if (mounted) {
            setUseLitePromoOverride(true);
            setLitePromoExpiresAt(storedExpiresAt);
            setTimerNow(now);
          }
          return;
        }

        if (storedValue) {
          await AsyncStorage.removeItem(LITE_PROMO_EXPIRES_AT_KEY);
        }
        if (mounted) {
          setUseLitePromoOverride(false);
          setLitePromoExpiresAt(null);
          setTimerNow(now);
        }
      } catch (err) {
        console.warn("[Paywall] No se pudo revisar la promo Lite", err);
        if (mounted) {
          setUseLitePromoOverride(false);
          setLitePromoExpiresAt(null);
          setTimerNow(now);
        }
      } finally {
        if (mounted) {
          setLitePromoCheckComplete(true);
        }
      }
    };

    void resolveLitePromoOverride();
    return () => {
      mounted = false;
    };
  }, [requestedPaywallVariant]);

  useEffect(() => {
    if (!isLitePaywall) {
      return;
    }

    let mounted = true;
    const startPromoTimer = async () => {
      const now = Date.now();
      let expiresAt = now + LITE_PROMO_DURATION_MS;

      try {
        const storedValue = await AsyncStorage.getItem(LITE_PROMO_EXPIRES_AT_KEY);
        const storedExpiresAt = storedValue ? Number(storedValue) : Number.NaN;
        if (Number.isFinite(storedExpiresAt) && storedExpiresAt > now) {
          expiresAt = storedExpiresAt;
        } else {
          await AsyncStorage.setItem(LITE_PROMO_EXPIRES_AT_KEY, String(expiresAt));
        }
      } catch (err) {
        console.warn("[Paywall] No se pudo preparar el temporizador promo", err);
      }

      if (mounted) {
        setLitePromoExpiresAt(expiresAt);
        setTimerNow(now);
      }
    };

    void startPromoTimer();
    return () => {
      mounted = false;
    };
  }, [isLitePaywall]);

  useEffect(() => {
    if (!isLitePaywall || !litePromoExpiresAt) {
      return;
    }

    const updateNow = () => setTimerNow(Date.now());
    updateNow();
    const interval = setInterval(updateNow, 1000);
    return () => clearInterval(interval);
  }, [isLitePaywall, litePromoExpiresAt]);

  useEffect(() => {
    if (trackedPaywallRef.current || !litePromoCheckComplete || (!isLitePaywall && isPro) || coinsLoading) {
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
    litePromoCheckComplete,
    maxCoins,
    paywallSource,
  ]);

  const activeOffering = useMemo(() => {
    if (!offerings) return undefined;
    if (!isLitePaywall) return offerings.current;
    return offerings.all?.[LITE_PROMO_OFFERING_ID] ||
      (offerings.current?.identifier === LITE_PROMO_OFFERING_ID ? offerings.current : undefined);
  }, [isLitePaywall, offerings]);

  const availablePackages = useMemo<PackageInfo[]>(() => {
    const all = activeOffering?.availablePackages || [];
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
        price: compactPriceString(product.priceString),
        priceAmount: product.price,
        productId: product.identifier,
        currencyCode: product.currencyCode,
        subscriptionPeriod: product.subscriptionPeriod,
        title,
        periodLabel,
        cadenceLabel,
        isRecommended,
      };
    });
  }, [activeOffering]);

  const litePackageInfo = useMemo(
    () =>
      availablePackages.find((info) => info.productId === LITE_PROMO_PRODUCT_ID) ||
      availablePackages.find((info) => info.pkg.identifier === LITE_PROMO_PACKAGE_ID) ||
      availablePackages.find((info) => info.subscriptionPeriod === "P1Y") ||
      availablePackages[0],
    [availablePackages]
  );

  const annualPackageInfo = useMemo(
    () => availablePackages.find((info) => info.subscriptionPeriod === "P1Y"),
    [availablePackages]
  );

  const monthlyPackageInfo = useMemo(
    () => availablePackages.find((info) => info.subscriptionPeriod === "P1M"),
    [availablePackages]
  );

  useEffect(() => {
    if (isLitePaywall) return;
    if (selectedBillingPeriod === "annual" && !annualPackageInfo && monthlyPackageInfo) {
      setSelectedBillingPeriod("monthly");
      return;
    }
    if (selectedBillingPeriod === "monthly" && !monthlyPackageInfo && annualPackageInfo) {
      setSelectedBillingPeriod("annual");
    }
  }, [annualPackageInfo, isLitePaywall, monthlyPackageInfo, selectedBillingPeriod]);

  const proPackageOptions = useMemo(() => {
    const options = [annualPackageInfo, monthlyPackageInfo].filter(
      (info): info is PackageInfo => Boolean(info)
    );
    return options.map(buildProPaywallProduct);
  }, [annualPackageInfo, monthlyPackageInfo]);

  const selectedProPackageInfo = useMemo(() => {
    if (selectedBillingPeriod === "monthly") {
      return monthlyPackageInfo || annualPackageInfo || availablePackages[0];
    }
    return annualPackageInfo || monthlyPackageInfo || availablePackages[0];
  }, [annualPackageInfo, availablePackages, monthlyPackageInfo, selectedBillingPeriod]);

  const selectedProProduct = useMemo(
    () => (selectedProPackageInfo ? buildProPaywallProduct(selectedProPackageInfo) : undefined),
    [selectedProPackageInfo]
  );

  const handleSelectProProduct = useCallback(
    (productId: string) => {
      if (annualPackageInfo?.pkg.identifier === productId) {
        setSelectedBillingPeriod("annual");
        return;
      }
      if (monthlyPackageInfo?.pkg.identifier === productId) {
        setSelectedBillingPeriod("monthly");
      }
    },
    [annualPackageInfo, monthlyPackageInfo]
  );

  const litePromoRemainingSeconds = litePromoExpiresAt
    ? Math.max(0, Math.ceil((litePromoExpiresAt - timerNow) / 1000))
    : Math.ceil(LITE_PROMO_DURATION_MS / 1000);
  const litePromoExpired = isLitePaywall && Boolean(litePromoExpiresAt) && litePromoRemainingSeconds <= 0;

  const litePromoProduct = useMemo<PromoPaywallProduct | undefined>(() => {
    if (!litePackageInfo) return undefined;
    return {
      title: "Plan Anual",
      price: litePackageInfo.price,
      currencyCode: litePackageInfo.currencyCode,
      originalPrice: litePackageInfo.currencyCode === "MXN" ? "$1,299 MXN" : undefined,
      monthlyEquivalent: formatMonthlyEquivalent(litePackageInfo),
    };
  }, [litePackageInfo]);

  const handlePurchase = async (info: PackageInfo) => {
    if (processingId) return;

    if (isLitePaywall && litePromoExpired) {
      setError("La promoción expiró. Vuelve a abrir la oferta para generar una nueva ventana.");
      return;
    }

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
      void trackMixpanelEvent("purchase_started", {
        event_category: "monetization",
        paywall_source: paywallSource || "unknown",
        package_id: info.pkg.identifier,
        product_id: info.pkg.product.identifier,
        price: info.pkg.product.price,
        price_string: info.pkg.product.priceString,
        currency: info.pkg.product.currencyCode,
        subscription_period: info.pkg.product.subscriptionPeriod || undefined,
        has_intro_offer: Boolean(info.pkg.product.introPrice),
        paywall_variant: isLitePaywall ? "lite" : "pro",
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
        Alert.alert(
          "¡Listo!",
          isLitePaywall
            ? "Tu plan anual Lite está activo."
            : "Ya eres Pro. Disfruta monedas ilimitadas."
        );
        dismissPaywall();
      }
    } catch (err: any) {
      void trackMixpanelEvent(err?.userCancelled ? "purchase_cancelled" : "purchase_failed", {
        event_category: "monetization",
        paywall_source: paywallSource || "unknown",
        package_id: info.pkg.identifier,
        product_id: info.pkg.product.identifier,
        paywall_variant: isLitePaywall ? "lite" : "pro",
        error_message: err?.userCancelled ? undefined : err?.message,
      });
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
      void trackMixpanelEvent("restore_started", {
        event_category: "monetization",
        paywall_source: paywallSource || "unknown",
      });
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
        dismissPaywall();
      }
    } catch (err: any) {
      void trackMixpanelEvent("restore_failed", {
        event_category: "monetization",
        paywall_source: paywallSource || "unknown",
        error_message: err?.message,
      });
      console.warn("[Paywall] Error al restaurar", err);
      setError(err?.message || "No pudimos restaurar las compras.");
    } finally {
      setRestoring(false);
    }
  };

  const content = !litePromoCheckComplete ? (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg }}>
      <ActivityIndicator color="#22d3ee" />
    </View>
  ) : isLitePaywall ? (
    <Step7
      remainingSeconds={litePromoRemainingSeconds}
      product={litePromoProduct}
      loading={loading || rcLoading}
      processing={processingId === litePackageInfo?.pkg.identifier}
      restoring={restoring}
      expired={litePromoExpired}
      error={
        error ||
        (!loading && !rcLoading && !litePackageInfo
          ? "No encontramos la oferta Lite configurada en RevenueCat."
          : null)
      }
      onClose={dismissPaywall}
      onPurchase={() => {
        if (litePackageInfo) void handlePurchase(litePackageInfo);
      }}
      onRestore={handleRestore}
      onOpenPrivacy={() => openExternal(PRIVACY_URL)}
      onOpenTerms={() => openExternal(TERMS_URL)}
    />
  ) : (
    <Step7
      mode="pro"
      remainingSeconds={0}
      product={selectedProProduct}
      products={proPackageOptions}
      selectedProductId={selectedProPackageInfo?.pkg.identifier}
      loading={loading || rcLoading}
      processing={Boolean(processingId)}
      restoring={restoring}
      expired={false}
      error={
        error ||
        (!loading && !rcLoading && !selectedProPackageInfo
          ? "No encontramos planes Pro configurados en RevenueCat."
          : null)
      }
      title="Obtén acceso ilimitado"
      subtitle="con el Plan Pro"
      ctaLabel="Continuar con Pro"
      onClose={dismissPaywall}
      onPurchase={() => {
        if (selectedProPackageInfo) void handlePurchase(selectedProPackageInfo);
      }}
      onSelectProduct={handleSelectProProduct}
      onRestore={handleRestore}
      onOpenPrivacy={() => openExternal(PRIVACY_URL)}
      onOpenTerms={() => openExternal(TERMS_URL)}
    />
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
