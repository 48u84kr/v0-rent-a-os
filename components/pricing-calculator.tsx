"use client"

import { useState } from "react"
import { Calculator, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { calculateRentalPricing, fetchBusinessSettings, type PricingResult } from "@/lib/pricing-engine"

interface PricingCalculatorProps {
  /**
   * Initial RRP value (optional)
   */
  initialRRP?: string
  /**
   * Initial depreciation rate (default: 20%)
   */
  initialDepreciation?: string
  /**
   * Callback when pricing is calculated
   */
  onCalculate?: (result: PricingResult) => void
  /**
   * Whether to show the calculate button (default: true)
   */
  showCalculateButton?: boolean
  /**
   * Custom class name for the container
   */
  className?: string
}

export function PricingCalculator({
  initialRRP = "",
  initialDepreciation = "20",
  onCalculate,
  showCalculateButton = true,
  className = "",
}: PricingCalculatorProps) {
  const { toast } = useToast()
  const [rrp, setRrp] = useState<string>(initialRRP)
  const [depreciation, setDepreciation] = useState<string>(initialDepreciation)
  const [result, setResult] = useState<PricingResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const handleCalculate = async () => {
    const rrpValue = Number.parseFloat(rrp)
    const depreciationValue = Number.parseFloat(depreciation) || 20

    if (isNaN(rrpValue) || rrpValue <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid RRP (Retail Price).",
        variant: "destructive",
      })
      return
    }

    setIsCalculating(true)

    try {
      const settings = await fetchBusinessSettings()
      const pricingResult = calculateRentalPricing(rrpValue, depreciationValue, settings)

      setResult(pricingResult)

      if (onCalculate) {
        onCalculate(pricingResult)
      }
    } catch (error) {
      console.error("Error calculating pricing:", error)
      toast({
        title: "Calculation Error",
        description: "Failed to calculate pricing. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCalculating(false)
    }
  }

  const reset = () => {
    setRrp("")
    setDepreciation("20")
    setResult(null)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Input Section */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pricing-rrp">Device RRP (Retail Price) *</Label>
          <div className="flex">
            <div className="flex items-center justify-center px-3 bg-muted border border-r-0 border-input rounded-l-xl text-sm text-muted-foreground h-9">
              AED
            </div>
            <Input
              id="pricing-rrp"
              type="number"
              placeholder="e.g., 4000"
              className="rounded-l-none rounded-r-xl"
              value={rrp}
              onChange={(e) => setRrp(e.target.value)}
              min="0"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pricing-depreciation">Depreciation Rate</Label>
          <div className="flex">
            <Input
              id="pricing-depreciation"
              type="number"
              placeholder="e.g., 20"
              className="rounded-l-xl rounded-r-none"
              value={depreciation}
              onChange={(e) => setDepreciation(e.target.value)}
              min="0"
              max="100"
            />
            <div className="flex items-center justify-center px-3 bg-muted border border-l-0 border-input rounded-r-xl text-sm text-muted-foreground h-9">
              %
            </div>
          </div>
        </div>
      </div>

      {showCalculateButton && (
        <Button onClick={handleCalculate} disabled={isCalculating || !rrp} className="w-full rounded-xl">
          {isCalculating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Pricing
            </>
          )}
        </Button>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Pricing Ladder</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">3 Months</p>
                  <p className="text-xl font-bold text-orange-600">AED {result.price3Month.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">×1.50</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">6 Months</p>
                  <p className="text-xl font-bold text-yellow-600">AED {result.price6Month.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">×1.30</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">12 Months</p>
                  <p className="text-xl font-bold text-green-600">AED {result.price12Month.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Anchor</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">24 Months</p>
                  <p className="text-xl font-bold text-blue-600">AED {result.price24Month.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">×0.85</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Calculation Breakdown</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Loan Cost:</span>
                <span className="font-medium">
                  AED {result.totalLoanCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Min Monthly Repayment:</span>
                <span className="font-medium">
                  AED {result.minMonthlyLoanRepayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Depreciation:</span>
                <span className="font-medium">
                  AED {result.monthlyDepreciation.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Cost:</span>
                <span className="font-medium">
                  AED {result.baseCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between col-span-2 pt-2 border-t">
                <span className="text-muted-foreground font-medium">Hard Floor (Min Price):</span>
                <span className="font-semibold text-destructive">
                  AED {result.hardFloor.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
