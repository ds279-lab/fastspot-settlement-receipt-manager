import {
  DEFAULT_MANUAL_SEND_FEE_TIERS,
  ManualSendFeeTier,
} from './financialCalculations';

export const MANUAL_SEND_FEES_STORAGE_KEY = 'fastspot_manual_send_fee_tiers_v1';

export const loadManualSendFeeTiers = (): ManualSendFeeTier[] => {
  try {
    const saved = localStorage.getItem(MANUAL_SEND_FEES_STORAGE_KEY);
    if (!saved) return DEFAULT_MANUAL_SEND_FEE_TIERS;

    const parsed: unknown = JSON.parse(saved);
    if (
      !Array.isArray(parsed) ||
      parsed.some(
        (tier) =>
          typeof tier.id !== 'string' ||
          !Number.isFinite(tier.minAmountUGX) ||
          (tier.maxAmountUGX !== null && !Number.isFinite(tier.maxAmountUGX)) ||
          !Number.isFinite(tier.feeUGX)
      )
    ) {
      throw new Error('Saved sending fee tiers have an invalid format');
    }

    return parsed;
  } catch (error) {
    console.error('Failed to load manual send fee tiers:', error);
    return DEFAULT_MANUAL_SEND_FEE_TIERS;
  }
};
