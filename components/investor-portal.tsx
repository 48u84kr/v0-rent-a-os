"use client"

import { useState, useEffect } from "react"
import {
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Wallet,
  PiggyBank,
  Calculator,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface Device {
  id: number
  name: string | null
  brand: string | null
  category: string | null
  serial_number: string | null
  storage: string | null
  color: string | null
  condition: string | null
  acquisition_cost_aed: number | null
  created_at: string
}

interface DeviceWithInvestorData extends Device {
  investorReturn: number
  monthlyPayment: number
  totalProfit: number
}

const INVESTOR_PROFIT_RATE = 0.15 // 15%
const PAYMENT_MONTHS = 24

export function InvestorPortal() {
  const [devices, setDevices] = useState<DeviceWithInvestorData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // Summary stats
  const [totalInvested, setTotalInvested] = useState(0)
  const [totalReturn, setTotalReturn] = useState(0)
  const [totalProfit, setTotalProfit] = useState(0)
  const [deviceCount, setDeviceCount] = useState(0)

  const fetchDevices = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("devices")
        .select("id, name, brand, category, serial_number, storage, color, condition, acquisition_cost_aed, created_at")
        .not("acquisition_cost_aed", "is", null)
        .order(sortField, { ascending: sortDirection === "asc" })

      if (error) {
        console.error("Error fetching devices:", error)
        return
      }

      // Calculate investor data for each device
      const devicesWithInvestorData: DeviceWithInvestorData[] = (data || []).map((device) => {
        const cost = device.acquisition_cost_aed || 0
        const investorReturn = cost * (1 + INVESTOR_PROFIT_RATE)
        const monthlyPayment = investorReturn / PAYMENT_MONTHS
        const profit = cost * INVESTOR_PROFIT_RATE

        return {
          ...device,
          investorReturn,
          monthlyPayment,
          totalProfit: profit,
        }
      })

      setDevices(devicesWithInvestorData)

      // Calculate summary stats
      const totals = devicesWithInvestorData.reduce(
        (acc, device) => {
          acc.invested += device.acquisition_cost_aed || 0
          acc.return += device.investorReturn
          acc.profit += device.totalProfit
          return acc
        },
        { invested: 0, return: 0, profit: 0 }
      )

      setTotalInvested(totals.invested)
      setTotalReturn(totals.return)
      setTotalProfit(totals.profit)
      setDeviceCount(devicesWithInvestorData.length)
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [sortField, sortDirection])

  // Filter devices based on search and category
  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      searchTerm === "" ||
      device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === "all" || device.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Get unique categories for filter
  const categories = [...new Set(devices.map((d) => d.category).filter(Boolean))]

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Investor Portal</h2>
          <p className="text-muted-foreground">
            View your investment portfolio and expected returns
          </p>
        </div>
        <Button onClick={fetchDevices} variant="outline" className="gap-2 bg-transparent">
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
                <p className="text-xs text-muted-foreground">
                  Across {deviceCount} devices
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Return</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalReturn)}</div>
                <p className="text-xs text-muted-foreground">
                  Expected total payout
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalProfit)}</div>
                <p className="text-xs text-muted-foreground">
                  15% return on investment
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payment (Avg)</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalReturn / PAYMENT_MONTHS)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Over {PAYMENT_MONTHS} months
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Portfolio</CardTitle>
          <CardDescription>
            Detailed breakdown of each device investment with expected returns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, brand, or serial number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category || ""}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("name")}
                  >
                    Device <SortIcon field="name" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("brand")}
                  >
                    Brand <SortIcon field="brand" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("category")}
                  >
                    Category <SortIcon field="category" />
                  </TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort("acquisition_cost_aed")}
                  >
                    Device Cost <SortIcon field="acquisition_cost_aed" />
                  </TableHead>
                  <TableHead className="text-right">Total Return (Cost + 15%)</TableHead>
                  <TableHead className="text-right">Monthly Payment (24mo)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No devices found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDevices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">
                        <div>
                          {device.name || "Unnamed Device"}
                          {device.serial_number && (
                            <div className="text-xs text-muted-foreground">
                              SN: {device.serial_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{device.brand || "-"}</TableCell>
                      <TableCell>
                        {device.category ? (
                          <Badge variant="outline">{device.category}</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{device.storage || "-"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(device.acquisition_cost_aed || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">
                        {formatCurrency(device.investorReturn)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{formatCurrency(device.monthlyPayment)}</div>
                        <div className="text-xs text-muted-foreground">per month</div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary Footer */}
          {!isLoading && filteredDevices.length > 0 && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Showing:</span>{" "}
                  <span className="font-medium">{filteredDevices.length} devices</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Cost:</span>{" "}
                  <span className="font-medium">
                    {formatCurrency(
                      filteredDevices.reduce((sum, d) => sum + (d.acquisition_cost_aed || 0), 0)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Return:</span>{" "}
                  <span className="font-medium text-emerald-600">
                    {formatCurrency(
                      filteredDevices.reduce((sum, d) => sum + d.investorReturn, 0)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Monthly Total:</span>{" "}
                  <span className="font-medium">
                    {formatCurrency(
                      filteredDevices.reduce((sum, d) => sum + d.monthlyPayment, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
