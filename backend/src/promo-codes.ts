export const PROMO_CODE = 'PRO123';
export const PROMO_PREMIUM_DAYS = 30;

export type PromoCodeValidationResult = {
  code: string;
  isValid: boolean;
  premiumDays: number;
};

export function validatePromoCode(input?: string): PromoCodeValidationResult {
  const submittedCode = (input || '').trim();
  return {
    code: PROMO_CODE,
    isValid: submittedCode.toUpperCase() === PROMO_CODE,
    premiumDays: PROMO_PREMIUM_DAYS,
  };
}

export function calculatePromoExpirationIso(
  premiumDays: number,
  nowMs: number = Date.now()
): string {
  return new Date(nowMs + premiumDays * 24 * 60 * 60 * 1000).toISOString();
}
