import { createClient } from "@/lib/supabase/client"

export interface PricingResult {
  hardFloor: number
  anchorPrice: number
  price3Month: number
  price6Month: number
  price12Month: number
  price24Month: number
  monthlyDepreciation: number
  totalLoanCost: number
  minMonthlyLoanRepayment: number
  baseCost: number
}

export interface BusinessSettings {
  investorRate: number
  riskProvision: number
  gatewayFee: number
  targetMargin: number
  logisticsBuffer: number
}

/**
 * Rounds a number up to the nearest 9 (e.g., 1234 -> 1239, 1240 -> 1249)
 */
export const roundUpToNearest9 = (value: number): number => {
  const remainder = value % 10
  if (remainder === 9) return value
  if (remainder < 9) return Math.floor(value / 10) * 10 + 9
  return Math.ceil(value / 10) * 10 + 9
}

/**
 * Fetches business settings from the database
 */
export const fetchBusinessSettings = async (): Promise<BusinessSettings> => {
  const supabase = createClient()
  const { data, error } = await supabase.from("business_settings").select("*").order("id")

  if (error) throw error

  const settings = data || []

  return {
    investorRate: (settings.find((s) => s.setting_key === "investor_profit_rate")?.value_percent || 15) / 100,
    riskProvision: (settings.find((s) => s.setting_key === "risk_provision")?.value_percent || 5) / 100,
    gatewayFee: (settings.find((s) => s.setting_key === "payment_gateway_fee")?.value_percent || 2.5) / 100,
    targetMargin: (settings.find((s) => s.setting_key === "target_margin")?.value_percent || 30) / 100,
    logisticsBuffer: settings.find((s) => s.setting_key === "logistics_buffer")?.value_aed || 500,
  }
}

/**
 * Calculates rental pricing based on RRP, depreciation, and business settings
 */
export const calculateRentalPricing = (
  rrp: number,
  depreciationPercent: number,
  settings: BusinessSettings,
): PricingResult => {
  const { investorRate, riskProvision, gatewayFee, targetMargin, logisticsBuffer } = settings

  // Calculate Residual Value (100% - depreciation%)
  const residualValuePercent = (100 - depreciationPercent) / 100

  // Step 1: Establish Cash Floor
  const totalLoanCost = rrp * (1 + investorRate * 2)
  const minMonthlyLoanRepayment = totalLoanCost / 24
  const hardFloor = minMonthlyLoanRepayment + logisticsBuffer

  // Step 2: Calculate 12-Month Anchor Price
  const monthlyDepreciation = (rrp - rrp * residualValuePercent) / 12
  const baseCost = Math.max(monthlyDepreciation, minMonthlyLoanRepayment) + logisticsBuffer
  const anchorPriceRaw = baseCost / (1 - (riskProvision + gatewayFee + targetMargin))
  const anchorPrice = roundUpToNearest9(anchorPriceRaw)

  // Step 3: Calculate Term Prices
  const price3Month = roundUpToNearest9(anchorPrice * 1.5)
  const price6Month = roundUpToNearest9(anchorPrice * 1.3)
  const price12Month = anchorPrice
  const price24MonthRaw = anchorPrice * 0.85
  const price24Month = price24MonthRaw < hardFloor ? roundUpToNearest9(hardFloor) : roundUpToNearest9(price24MonthRaw)

  return {
    hardFloor,
    anchorPrice,
    price3Month,
    price6Month,
    price12Month,
    price24Month,
    monthlyDepreciation,
    totalLoanCost,
    minMonthlyLoanRepayment,
    baseCost,
  }
}
