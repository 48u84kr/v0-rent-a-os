# Pricing Feature

This folder contains all pricing-related functionality for the rentA OS application.

## Components

### PricingCalculator

A reusable component that calculates rental pricing based on:
- Device RRP (Retail Recommended Price)
- Depreciation rate
- Business settings (investor rate, risk provision, payment gateway fees, etc.)

**Usage:**

```tsx
import { PricingCalculator } from "@/features/pricing"

function MyComponent() {
  return (
    <PricingCalculator
      initialRRP="4000"
      initialDepreciation="20"
      onCalculate={(result) => console.log(result)}
    />
  )
}
```

**Props:**
- `initialRRP` - Initial retail price value
- `initialDepreciation` - Initial depreciation percentage (default: 20)
- `onCalculate` - Callback function when pricing is calculated
- `showCalculateButton` - Whether to show the calculate button (default: true)
- `className` - Custom CSS classes

## Pricing Engine

The pricing calculations are handled by the `@/lib/pricing-engine` module, which provides:
- `calculateRentalPricing()` - Core pricing calculation function
- `fetchBusinessSettings()` - Retrieves business settings from database
- `roundUpToNearest9()` - Pricing display helper

## Pricing Logic

The calculator generates a pricing ladder with 4 tiers:
- **3 Months**: 1.5x anchor price
- **6 Months**: 1.3x anchor price
- **12 Months**: Anchor price (base)
- **24 Months**: 0.85x anchor price (with hard floor protection)

All calculations factor in:
- Investor profit rate
- Risk provision
- Payment gateway fees
- Target profit margin
- Logistics buffer
